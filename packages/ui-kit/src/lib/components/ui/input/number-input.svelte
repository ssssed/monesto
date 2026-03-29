<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { z } from 'zod';
	import { subscribeElementActuallyVisibleToUser } from './input-viewport-visibility';
	import Keyboard from './keyboard.svelte';
	import type { InputFocusUnderline, InputSize, NumberInputTextAlign } from './types';

	const NUMBER_INPUT_VARIANTS = {
		primary: '',
		secondary: 'rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] h-12'
	} as const;

	type NumberInputVariant = keyof typeof NUMBER_INPUT_VARIANTS;

	const NUMBER_INPUT_SIZES: Record<
		InputSize,
		{
			rootMinH: string;
			viewportH: string;
			prefixText: string;
			valueText: string;
			caret: string;
			caretEmptyShift: string;
			underlineH: string;
			underlineWCenter: string;
		}
	> = {
		sm: {
			rootMinH: 'min-h-14',
			viewportH: 'h-12',
			prefixText: 'text-lg font-bold',
			valueText: 'text-xl font-bold',
			caret: 'h-6 w-[2px]',
			caretEmptyShift: '',
			underlineH: 'h-1',
			underlineWCenter: 'w-12'
		},
		default: {
			rootMinH: 'min-h-20',
			viewportH: 'h-16',
			prefixText: 'text-2xl font-bold',
			valueText: 'text-5xl font-bold',
			caret: 'h-10 w-[2px]',
			caretEmptyShift: '-translate-x-3',
			underlineH: 'h-1.5',
			underlineWCenter: 'w-14'
		},
		lg: {
			rootMinH: 'min-h-25.5',
			viewportH: 'h-24',
			prefixText: 'text-5xl font-bold',
			valueText: 'text-7xl font-bold',
			caret: 'h-16 w-[2px]',
			caretEmptyShift: '-translate-x-[25px]',
			underlineH: 'h-1.5',
			underlineWCenter: 'w-16'
		}
	};

	// Валидное float-значение: одна точка, не начинается с '.', без ведущего 0 кроме "0" и "0.xxx"
	const numberInputSchema = z
		.string()
		.refine((s) => (s.match(/\./g) || []).length <= 1, { message: '' }) // не более одной точки в целом
		.refine((s) => s === '' || s[0] !== '.', { message: '' }) // перед точкой должна быть цифра
		.refine(
			(s) =>
				s === '' ||
				s === '0' ||
				s[0] !== '0' ||
				(s.length > 1 && s[1] === '.'),
			{ message: '' }
		)
		.refine((s) => /^\d*\.?\d*$/.test(s), { message: '' });

	function isValidNumberInput(s: string): boolean {
		const result = numberInputSchema.safeParse(s);
		return result.success;
	}

	let {
		value = $bindable(''),
		ref = $bindable(null),
		children: footerSnippet,
		onEnter,
		label,
		forAttribute,
		prefix = $bindable(''),
		size = 'default',
		focusUnderline = 'center',
		textAlign = 'center',
		class: className,
		variant = 'primary'
	} = $props<{
		value: string;
		children?: Snippet<[{ onClose: () => void }]>;
		label?: string;
		forAttribute?: string;
		prefix?: string;
		ref?: HTMLDivElement | null;
		onOpened?: (ref: HTMLDivElement, keyboardRef: HTMLElement) => void;
		onEnter?: () => void;
		size?: InputSize;
		/** Полоска под полем: `center` — узкая по центру и растягивается при фокусе; `full` — сразу на всю ширину. */
		focusUnderline?: InputFocusUnderline;
		/** Выравнивание префикса и числа по горизонтали. */
		textAlign?: NumberInputTextAlign;
		class?: string;
		variant?: NumberInputVariant
	}>();

	const sz = $derived(NUMBER_INPUT_SIZES[(size ?? 'default') as InputSize]);
	const variantClass = $derived(NUMBER_INPUT_VARIANTS[(variant ?? 'primary') as NumberInputVariant]);

	let opened = $state(false);
	let inputActuallyVisible = $state(false);

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

	$effect(() => {
		if (!opened || !ref) return;
		return subscribeElementActuallyVisibleToUser(ref, (visible) => {
			inputActuallyVisible = visible;
		});
	});

	/** Как в поле: не показывать на клавиатуре один только prefix при пустом value — всегда с числом (в т.ч. «0»). */
	const keyboardTitle = $derived(
		opened && inputActuallyVisible
			? ''
			: prefix
				? `${prefix}${value || '0'}`
				: value
	);
</script>

<div class={cn("group relative", sz.rootMinH, className)}>
  {#if label}
    <label class="sr-only" for={forAttribute}>{label}</label>
  {/if}
  <button
    bind:this={ref}
    role="textbox"
    tabindex="0"
    onclick={async () => {
      opened = true;
    }}
    class={cn(
      "relative flex w-full min-w-0 cursor-text items-center select-none",
      textAlign === "center" ? "justify-center" : "justify-start",
      variantClass,
    )}
  >
    <div
      class={cn(
        "flex min-w-0 items-center gap-1",
        textAlign === "center" ? "max-w-full" : "w-full",
      )}
    >
      <span
        class={cn("shrink-0 text-slate-400 dark:text-slate-600", sz.prefixText)}
      >
        {prefix}
      </span>

      <div
        bind:this={viewportEl}
        class={cn("relative min-w-0 flex-1 overflow-hidden", sz.viewportH)}
      >
        <div
          bind:this={contentEl}
          class={cn(
            "flex h-full w-full items-center gap-1 whitespace-nowrap text-slate-900 dark:text-white",
            sz.valueText,
            textAlign === "center" ? "justify-center" : "justify-start",
            {
              ["ml-2"]: textAlign === "left" && variant === "secondary",
            },
          )}
          style="transform: translateX({offset}px)"
        >
          <span
            class={cn(
              "transition-colors",
              !value ? "text-slate-200 dark:text-slate-700" : "",
            )}
          >
            {value || "0"}
          </span>

          {#if opened}
            <span
              class={cn(
                "caret bg-primary",
                sz.caret,
                value === "" ? sz.caretEmptyShift : "",
              )}
            ></span>
          {/if}
        </div>
      </div>
    </div>
  </button>
  {#if opened && focusUnderline !== "none"}
    <div
      class={cn(
        "rounded-full bg-primary/30 transition-all duration-300 ease-out group-focus-within:bg-primary/30",
        sz.underlineH,
        focusUnderline === "full"
          ? "w-full"
          : cn("mx-auto", sz.underlineWCenter, "group-focus-within:w-full"),
      )}
    ></div>
  {/if}
</div>

<Keyboard
  {opened}
  {onEnter}
  title={keyboardTitle}
  onClose={() => {
    opened = false;
  }}
  onItemClick={(s: string) => {
    const next = value + s;
    if (isValidNumberInput(next)) value = next;
  }}
  onRemoveSymbol={() => (value = value.slice(0, -1))}
>
  {#snippet children({ onClose })}
    {@render footerSnippet?.({ onClose })}
  {/snippet}
</Keyboard>

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
