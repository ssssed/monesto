<script lang="ts" module>
	export type { TipsProps } from './types.js';
</script>

<script lang="ts">
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Driver, DriveStep } from 'driver.js';
	import './tips.css';
	import { cn } from '$lib/utils.js';
	import type { TipStep, TipsProps } from './types.js';

	let {
		steps,
		opened = $bindable(false),
		autoStart = false,
		storageKey,
		onClose,
		class: className,
		children
	}: TipsProps & { children?: Snippet } = $props();

	let driverInstance = $state<Driver | null>(null);
	let isRestarting = false;
	let isMounted = $state(false);
	let tourActive = false;

	const toDriveSteps = (items: TipStep[]): DriveStep[] =>
		items
			.filter((step) => {
				if (typeof document === 'undefined') {
					return true;
				}

				return Boolean(document.querySelector(step.selector));
			})
			.map((step) => ({
				element: step.selector,
				popover: {
					title: step.title,
					description: step.description,
					side: step.side ?? 'bottom',
					align: step.align ?? 'start'
				}
			}));

	const finishTour = () => {
		if (storageKey) {
			localStorage.setItem(storageKey, 'true');
		}

		onClose?.();
	};

	const stopTour = ({ silent = false }: { silent?: boolean } = {}) => {
		if (!driverInstance) {
			return;
		}

		if (silent) {
			isRestarting = true;
		}

		driverInstance.destroy();
		driverInstance = null;
	};

	const startTour = async (items: TipStep[]) => {
		if (!isMounted || items.length === 0 || tourActive) {
			return;
		}

		tourActive = true;

		stopTour({ silent: true });
		await tick();

		if (!opened) {
			tourActive = false;
			return;
		}

		const driveSteps = toDriveSteps(items);

		if (driveSteps.length === 0) {
			tourActive = false;
			opened = false;
			return;
		}

		const { driver } = await import('driver.js');
		await import('driver.js/dist/driver.css');

		if (!opened) {
			tourActive = false;
			return;
		}

		const instance = driver({
			steps: driveSteps,
			animate: true,
			allowClose: true,
			smoothScroll: true,
			showProgress: false,
			showButtons: ['previous', 'next', 'close'],
			popoverClass: cn('monesto-tips-popover', className),
			overlayColor: '#000000',
			overlayOpacity: 0.6,
			stagePadding: 8,
			stageRadius: 12,
			nextBtnText: 'Дальше',
			prevBtnText: 'Назад',
			doneBtnText: 'Закрыть',
			onNextClick: (_element, _step, { driver: activeDriver }) => {
				if (activeDriver.isLastStep()) {
					activeDriver.destroy();
					return;
				}

				activeDriver.moveNext();
			},
			onPrevClick: (_element, _step, { driver: activeDriver }) => {
				if (activeDriver.isFirstStep()) {
					activeDriver.moveTo(driveSteps.length - 1);
					return;
				}

				activeDriver.movePrevious();
			},
			onCloseClick: (_element, _step, { driver: activeDriver }) => {
				activeDriver.destroy();
			},
			onDestroyed: () => {
				driverInstance = null;
				tourActive = false;

				if (isRestarting) {
					isRestarting = false;
					return;
				}

				opened = false;
				finishTour();
			}
		});

		if (!opened) {
			tourActive = false;
			instance.destroy();
			return;
		}

		driverInstance = instance;
		instance.drive();
	};

	onMount(async () => {
		isMounted = true;

		if (!autoStart) {
			return;
		}

		if (storageKey && localStorage.getItem(storageKey)) {
			return;
		}

		await tick();
		opened = true;
	});

	$effect(() => {
		if (!isMounted) {
			return;
		}

		if (!opened) {
			tourActive = false;
			stopTour();
			return;
		}

		if (tourActive) {
			return;
		}

		const items = untrack(() => steps);
		void startTour(items);
	});

	onDestroy(() => {
		isMounted = false;
		tourActive = false;
		stopTour();
	});
</script>

{@render children?.()}
