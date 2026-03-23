<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import TextKeyboard from './text-keyboard.svelte';

	let {
		value = $bindable(''),
		ref = $bindable(null),
		children: footerSnippet,
		label,
		forAttribute,
		placeholder = '',
		maxLength,
		onEnter
	} = $props<{
		value: string;
		children?: Snippet<[{ onClose: () => void }]>;
		label?: string;
		forAttribute?: string;
		placeholder?: string;
		maxLength?: number;
		ref?: HTMLDivElement | null;
		onEnter?: () => void;
	}>();

	let opened = $state(false);

	let viewportEl: HTMLDivElement;
	let contentEl: HTMLDivElement;
	let offset = $state(0);

	$effect(() => {
		if (!opened || !viewportEl) return;

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

	/**
	 * Добавляет фрагмент текста в значение с учётом `maxLength`.
	 * @param props — строка `fragment`
	 */
	function appendFragment(props: { fragment: string }) {
		const { fragment } = props;
		let next = value + fragment;
		if (maxLength !== undefined && next.length > maxLength) {
			next = next.slice(0, maxLength);
		}
		value = next;
	}

	/**
	 * Удаляет последний символ значения.
	 * @param props — без полей
	 */
	function removeLastSymbol(props: object) {
		void props;
		value = value.slice(0, -1);
	}

	/**
	 * Закрывает оверлей клавиатуры.
	 * @param props — без полей
	 */
	function closeKeyboard(props: object) {
		void props;
		opened = false;
	}
</script>

<div class="relative min-h-25.5">
	{#if label}
		<label class="sr-only" for={forAttribute}>{label}</label>
	{/if}
	<button
		bind:this={ref}
		role="textbox"
		tabindex="0"
		onclick={() => {
			opened = true;
		}}
		class="group relative flex w-full cursor-text items-center justify-center select-none"
	>
		<div bind:this={viewportEl} class="relative h-24 max-w-full overflow-hidden">
			<div
				bind:this={contentEl}
				class="flex h-full items-center gap-1 text-5xl font-bold whitespace-nowrap text-slate-900 dark:text-white"
				style="transform: translateX({offset}px)"
			>
				<span
					class={cn(
						'transition-colors',
						value === ''
							? 'text-slate-400 dark:text-slate-600'
							: 'text-slate-900 dark:text-white'
					)}
				>
					{value === '' ? placeholder || ' ' : value}
				</span>

				{#if opened}
					<span class={cn('caret h-14 w-[2px] bg-primary', { '-translate-x-1': value === '' })}></span>
				{/if}
			</div>
		</div>
	</button>
	{#if opened}
		<div
			class="mx-auto h-1.5 w-16 rounded-full bg-primary/30 transition-all duration-300 ease-out group-focus-within:w-full group-focus-within:bg-primary"
		></div>
	{/if}
</div>

<TextKeyboard
	{opened}
	title={value || placeholder}
	{onEnter}
	onClose={() => closeKeyboard({})}
	onItemClick={(s: string) => appendFragment({ fragment: s })}
	onRemoveSymbol={() => removeLastSymbol({})}
>
	{#snippet children({ onClose })}
		{@render footerSnippet?.({ onClose })}
	{/snippet}
</TextKeyboard>

<style>
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
