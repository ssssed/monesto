<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import TextKeyboard from './text-keyboard.svelte';
	import type { InputSize } from './types';

	const TEXT_INPUT_SIZES: Record<
		InputSize,
		{
			rootMinH: string;
			viewportH: string;
			valueText: string;
			caret: string;
			caretEmptyShift: string;
			focusLine: string;
		}
	> = {
		sm: {
			rootMinH: 'min-h-14',
			viewportH: 'h-12',
			valueText: 'text-xl font-bold',
			caret: 'h-6 w-[2px]',
			caretEmptyShift: '',
			focusLine: 'h-1 w-12'
		},
		default: {
			rootMinH: 'min-h-20',
			viewportH: 'h-16',
			valueText: 'text-3xl font-bold',
			caret: 'h-10 w-[2px]',
			caretEmptyShift: '-translate-x-0.5',
			focusLine: 'h-1.5 w-14'
		},
		lg: {
			rootMinH: 'min-h-25.5',
			viewportH: 'h-24',
			valueText: 'text-5xl font-bold',
			caret: 'h-14 w-[2px]',
			caretEmptyShift: '-translate-x-1',
			focusLine: 'h-1.5 w-16'
		}
	};

	let {
		value = $bindable(''),
		ref = $bindable(null),
		children: footerSnippet,
		label,
		forAttribute,
		placeholder = '',
		maxLength,
		onEnter,
		size = 'default',
		class: className
	} = $props<{
		value: string;
		children?: Snippet<[{ onClose: () => void }]>;
		label?: string;
		forAttribute?: string;
		placeholder?: string;
		maxLength?: number;
		ref?: HTMLDivElement | null;
		onEnter?: () => void;
		size?: InputSize;
		class?: string;
	}>();

	const sz = $derived(TEXT_INPUT_SIZES[(size ?? 'default') as InputSize]);

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
	 * @param fragment — вставляемый символ или строка
	 */
	function appendFragment(fragment: string) {
		let next = value + fragment;
		if (maxLength !== undefined && next.length > maxLength) {
			next = next.slice(0, maxLength);
		}
		value = next;
	}

	/** Удаляет последний символ значения. */
	function removeLastSymbol() {
		value = value.slice(0, -1);
	}

	/** Закрывает оверлей клавиатуры. */
	function closeKeyboard() {
		opened = false;
	}
</script>

<div class={cn('relative', sz.rootMinH, className)}>
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
		<div bind:this={viewportEl} class={cn('relative max-w-full overflow-hidden', sz.viewportH)}>
			<div
				bind:this={contentEl}
				class={cn(
					'flex h-full items-center gap-1 whitespace-nowrap text-slate-900 dark:text-white',
					sz.valueText
				)}
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
					<span class={cn('caret bg-primary', sz.caret, value === '' ? sz.caretEmptyShift : '')}></span>
				{/if}
			</div>
		</div>
	</button>
	{#if opened}
		<div
			class={cn(
				'mx-auto rounded-full bg-primary/30 transition-all duration-300 ease-out group-focus-within:w-full group-focus-within:bg-primary',
				sz.focusLine
			)}
		></div>
	{/if}
</div>

<TextKeyboard
	{opened}
	title={value || placeholder}
	{onEnter}
	onClose={closeKeyboard}
	onItemClick={appendFragment}
	onRemoveSymbol={removeLastSymbol}
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
