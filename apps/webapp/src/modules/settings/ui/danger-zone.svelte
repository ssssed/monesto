<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import { Button } from '@monesto/ui-kit';
	import { resetUserData } from '../api';
	import { AllocateRulesStore } from '../model/model.svelte';

	const DEFAULT_TEXT = 'Очистить все данные';
	const CONFIRM_TEXT = 'Вы уверены?';
	const TYPEWRITER_INTERVAL_MS = 45;

	let loading = $state<boolean>(false);
	let isConfirming = $state(false);
	let buttonText = $state(DEFAULT_TEXT);
	let buttonRef = $state<HTMLButtonElement | null>(null);
	let typewriterTimer: ReturnType<typeof setInterval> | undefined;

	const rulesStore = AllocateRulesStore.getContext();

	function clearTypewriter() {
		if (typewriterTimer !== undefined) {
			clearInterval(typewriterTimer);
			typewriterTimer = undefined;
		}
	}

	function startTypewriter(text: string) {
		clearTypewriter();
		buttonText = '';

		let index = 0;
		typewriterTimer = setInterval(() => {
			index += 1;
			buttonText = text.slice(0, index);

			if (index >= text.length) {
				clearTypewriter();
			}
		}, TYPEWRITER_INTERVAL_MS);
	}

	function resetConfirmation() {
		clearTypewriter();
		isConfirming = false;
		buttonText = DEFAULT_TEXT;
	}

	function handleClick(event: MouseEvent) {
		event.stopPropagation();

		if (loading) return;

		if (!isConfirming) {
			isConfirming = true;
			startTypewriter(CONFIRM_TEXT);
			return;
		}

		void handleClearUserData();
	}

	async function handleClearUserData() {
		try {
			loading = true;
			await resetUserData();
			rulesStore.clear();
			resetConfirmation();
		} catch {
			console.error('reset error');
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!isConfirming) return;

		function handlePointerDown(event: PointerEvent) {
			if (buttonRef?.contains(event.target as Node)) return;
			resetConfirmation();
		}

		const timeoutId = setTimeout(() => {
			document.addEventListener('pointerdown', handlePointerDown);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('pointerdown', handlePointerDown);
		};
	});

	$effect(() => {
		return () => clearTypewriter();
	});
</script>

<section class="flex flex-col gap-1.5 mt-5">
	<p class="text-[#dc2626] text-[14px] font-semibold">Опасная зона</p>
	<Button variant="danger" size="lg" bind:ref={buttonRef} onclick={handleClick} disabled={loading}>
		<Trash2 />
		{buttonText}
	</Button>
	<p class="text-[#94A3B8] text-[12px]">Все активы, правила и история будут удалены</p>
</section>
