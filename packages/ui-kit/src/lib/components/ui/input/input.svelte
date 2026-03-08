<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import Keyboard from './keyboard.svelte';

	let {
		value = $bindable(''),
		ref = $bindable(null),
		children,
		onEnter,
		label,
		forAttribute,
		prefix = $bindable('')
	} = $props<{
		value: string;
		children?: Snippet;
		label?: string;
		forAttribute?: string;
		prefix?: string;
		ref?: HTMLDivElement | null;
		onOpened?: (ref: HTMLDivElement, keyboardRef: HTMLElement) => void;
		onEnter?: () => void;
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

<div class="relative min-h-25.5">
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
    class="group relative flex w-full cursor-text items-center justify-center select-none"
  >
    <span class="mr-1 text-5xl font-bold text-slate-400 dark:text-slate-600">
      {prefix}
    </span>

    <!-- viewport -->
    <div
      bind:this={viewportEl}
      class="relative h-24 max-w-full overflow-hidden"
    >
      <!-- content -->
      <div
        bind:this={contentEl}
        class="flex h-full items-center gap-1 text-7xl
				font-bold whitespace-nowrap text-slate-900 dark:text-white"
        style="transform: translateX({offset}px)"
      >
        <span class:value-empty={!value} class="transition-colors">
          {value || "0"}
        </span>

        {#if opened}
          <span
            class={cn("caret h-16 w-[2px] bg-primary", {
              "-translate-x-[25px]": value === "",
            })}
          ></span>
        {/if}
      </div>
    </div>
  </button>
  <!-- Decorative focus line -->
  {#if opened}
    <div
      class="mx-auto h-1.5 w-16 rounded-full bg-primary/30 transition-all duration-300 ease-out group-focus-within:w-full group-focus-within:bg-primary"
    ></div>
  {/if}
</div>

<Keyboard
  {opened}
  {onEnter}
  title={`${prefix}${value}`}
  onClose={() => {
    opened = false;
  }}
  onItemClick={(s) => (value += s)}
  onRemoveSymbol={() => (value = value.slice(0, -1))}
>
  {@render children?.()}
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
