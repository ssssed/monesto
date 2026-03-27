<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { subscribeElementActuallyVisibleToUser } from './input-viewport-visibility';
	import TextKeyboard from './text-keyboard.svelte';
	import type { InputFocusUnderline, InputSize, TextInputTextAlign } from './types';

	const TEXT_INPUT_SIZES: Record<
		InputSize,
		{
			rootMinH: string;
			viewportH: string;
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
			valueText: 'text-xl font-bold',
			caret: 'h-6 w-[2px]',
			caretEmptyShift: '',
			underlineH: 'h-1',
			underlineWCenter: 'w-12'
		},
		default: {
			rootMinH: 'min-h-20',
			viewportH: 'h-16',
			valueText: 'text-3xl font-bold',
			caret: 'h-10 w-[2px]',
			caretEmptyShift: '-translate-x-0.5',
			underlineH: 'h-1.5',
			underlineWCenter: 'w-14'
		},
		lg: {
			rootMinH: 'min-h-25.5',
			viewportH: 'h-24',
			valueText: 'text-5xl font-bold',
			caret: 'h-14 w-[2px]',
			caretEmptyShift: '-translate-x-1',
			underlineH: 'h-1.5',
			underlineWCenter: 'w-16'
		}
	};

	const TEXT_INPUT_VARIANTS = {
		primary: '',
		secondary: 'rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] h-12'
	} as const;

	type TextInputVariant = keyof typeof TEXT_INPUT_VARIANTS;

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
		focusUnderline = 'center',
		variant = 'primary',
		textAlign = 'center',
		class: className
	} = $props<{
		value: string;
		children?: Snippet<[{ onClose: () => void }]>;
		label?: string;
		forAttribute?: string;
		placeholder?: string;
		maxLength?: number;
		ref?: HTMLButtonElement | null;
		onEnter?: () => void;
		size?: InputSize;
		/** Полоска под полем: `center` — узкая по центру и растягивается при фокусе; `full` — сразу на всю ширину. */
		focusUnderline?: InputFocusUnderline;
		variant?: TextInputVariant;
		/** Горизонтальное выравнивание текста. */
		textAlign?: TextInputTextAlign;
		class?: string;
	}>();

	const sz = $derived(TEXT_INPUT_SIZES[(size ?? 'default') as InputSize]);
	const variantClass = $derived(TEXT_INPUT_VARIANTS[(variant ?? 'primary') as TextInputVariant]);

	let opened = $state(false);
	/** Поле реально видно пользователю (не перекрыто модалкой) — заголовок на клавиатуре не дублируем. */
	let inputActuallyVisible = $state(false);

	let viewportEl: HTMLDivElement;
	let contentEl: HTMLDivElement;
	let offset = $state(0);

	// Автоскролл при открытии клавиатуры
	$effect(() => {
		if (!opened || !viewportEl) return;

		// Даём немного времени рендеру клавиатуры
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

	// Как number-input: `ref` на кнопку (ширина поля для геометрии); перекрытие клавиатурой в модалке — в `input-viewport-visibility`.
	$effect(() => {
		if (!opened || !ref) return;
		return subscribeElementActuallyVisibleToUser(ref, (visible) => {
			inputActuallyVisible = visible;
		});
	});

	/** Как в number-input: при реально видимом поле заголовок на клавиатуре пустой (не дублируем значение). */
	const keyboardTitle = $derived(
		opened && inputActuallyVisible ? '' : value || placeholder
	);

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
          )}
          style="transform: translateX({offset}px)"
        >
          <span
            class={cn(
              "ml-3.5 transition-colors",
              value === ""
                ? "text-slate-400 dark:text-slate-600"
                : "text-slate-900 dark:text-white",
              {
                "text-base font-medium": variant === "secondary",
              },
            )}
          >
            {value === "" ? placeholder || " " : value}
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

<TextKeyboard
  {opened}
  title={keyboardTitle}
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
