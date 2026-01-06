<script lang="ts">
	import Keyboard from './keyboard.svelte';
	import ContinueButton from './continue-button.svelte';
	import { cn } from '$lib/shared/utils';

	let {
		value = $bindable(''),
		ref = $bindable(null),
		onOpened
	} = $props<{
		value: string;
		ref?: HTMLDivElement | null;
		onOpened?: (ref: HTMLDivElement, keyboardRef: HTMLElement) => void;
	}>();

	let opened = $state(false);

	let viewportEl: HTMLDivElement;
	let contentEl: HTMLDivElement;
	let offset = $state(0);

	// Автоскролл при открытии клавиатуры
	$effect(() => {
		if (!opened || !viewportEl) return;

		// Даем немного времени рендеру клавиатуры
		setTimeout(() => {
			viewportEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 50);
	});

	$effect(() => {
		if (!viewportEl || !contentEl) return;

		const ro = new ResizeObserver(() => {
			const overflow = contentEl.scrollWidth - viewportEl.clientWidth;

			offset = overflow > 0 ? -overflow : 0;
		});

		ro.observe(contentEl);
		ro.observe(viewportEl);

		return () => ro.disconnect();
	});
</script>

<div class="relative mb-8 flex w-full max-w-[320px] flex-col items-center">
	<label class="sr-only" for="income-input">Monthly Income</label>
	<div
		bind:this={ref}
		role="textbox"
		tabindex="0"
		onclick={async () => {
			opened = true;
		}}
		class="group relative flex w-full cursor-text items-center justify-center select-none"
	>
		<span class="mr-1 text-5xl font-bold text-slate-400 dark:text-slate-600"> $ </span>

		<!-- viewport -->
		<div bind:this={viewportEl} class="relative h-24 max-w-full overflow-hidden">
			<!-- content -->
			<div
				bind:this={contentEl}
				class="flex h-full items-center gap-1 text-7xl
				font-bold whitespace-nowrap text-slate-900 dark:text-white"
				style="transform: translateX({offset}px)"
			>
				<span class:value-empty={!value} class="transition-colors">
					{value || '0'}
				</span>

				<span
					class={cn('caret h-16 w-[2px] bg-primary', { '-translate-x-[25px]': value === '' })}
				/>
			</div>
		</div>
	</div>
	<!-- Decorative focus line -->
	{#if opened}
		<div
			class="mt-2 h-1.5 w-16 rounded-full bg-primary/30 transition-all duration-300 ease-out group-focus-within:w-full group-focus-within:bg-primary"
		/>
	{/if}
</div>

<Keyboard
	{opened}
  title={`$${value}`}
	onClose={() => {
		opened = false;
	}}
	onItemClick={(s) => (value += s)}
	onRemoveSymbol={() => (value = value.slice(0, -1))}
>
	<ContinueButton disabled={value.length === 0} onclick={() => (opened = false)} />
</Keyboard>

<style>
	.value-empty {
		color: rgb(226 232 240); /* slate-200 */
	}

	.dark .value-empty {
		color: rgb(71 85 105); /* slate-700 */
	}

	@keyframes caret-blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}

	.caret {
		animation: caret-blink 1s steps(1) infinite;
	}
</style>
