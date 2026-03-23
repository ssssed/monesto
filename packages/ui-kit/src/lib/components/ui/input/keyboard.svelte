<script lang="ts">
	import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '$lib/components/ui/drawer';
	import { cn } from '$lib/utils';
	import { Delete } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	let { children, opened, onClose, onItemClick, onRemoveSymbol, title, onEnter } = $props<{
		children?: Snippet<[{ onClose: () => void }]>;
		ref?: HTMLElement | null;
		opened: boolean;
		title?: string;
		onClose: () => void;
		onItemClick: (symbol: string) => void;
		onRemoveSymbol: () => void;
		onEnter?: () => void;
	}>();

	const number = [...Array.from({ length: 9 }, (_, i) => String(i + 1)), '.', '0'];

	let activeKey = $state<string | null>(null);

	/**
	 * Кратко подсвечивает нажатую клавишу.
	 * @param props — строка `keyId` (код клавиши)
	 */
	function pressKey(props: { keyId: string }) {
		const { keyId } = props;
		activeKey = keyId;
		setTimeout(() => (activeKey = null), 120);
	}

	/**
	 * Предотвращает закрытие дроера при клике по области клавиатуры.
	 * @param props — событие мыши `e`
	 */
	const handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
		e.stopPropagation();
	};

	/**
	 * Пробрасывает ввод цифры или точки в родителя.
	 * @param props — символ `symbol`
	 */
	function handleInput(props: { symbol: string }) {
		const { symbol } = props;
		onItemClick(symbol);
	}

	/**
	 * Удаляет последний введённый символ.
	 * @param props — без полей
	 */
	function handleBackspace(props: object) {
		void props;
		onRemoveSymbol();
	}

	$effect(() => {
		if (!opened) return;

		const onKeyDown = (e: KeyboardEvent) => {
			pressKey({ keyId: e.key });
			// цифры
			if (/^[0-9]$/.test(e.key)) {
				e.preventDefault();
				handleInput({ symbol: e.key });
				return;
			}

			// точка
			if (e.key === '.') {
				e.preventDefault();
				handleInput({ symbol: '.' });
				return;
			}

			// backspace
			if (e.key === 'Backspace') {
				e.preventDefault();
				handleBackspace({});
				return;
			}

			if (e.key === 'Enter') {
				e.preventDefault();
				onEnter?.();
				return;
			}
		};

		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<Drawer open={opened} {onClose}>
  <DrawerContent onclick={handleClick}>
    <DrawerHeader>
      <DrawerTitle>
        {#if title.length > 1}
          <p class="text-center text-lg">
            {title}
          </p>
        {/if}
      </DrawerTitle>
    </DrawerHeader>
    <div class="grid grid-cols-3 gap-x-6 gap-y-4">
      {#each number as number (number)}
        <button
          class={cn(
            "keypad-btn flex h-14 items-center justify-center rounded-xl text-2xl font-medium text-slate-900 transition-transform active:scale-95 active:bg-primary/10 dark:text-white",
            {
              "scale-95 bg-primary/10": activeKey === number,
            },
          )}
          onclick={() => handleInput({ symbol: number })}>{number}</button
        >
      {/each}
      <button
        class={cn(
          "keypad-btn flex h-14 items-center justify-center rounded-xl text-slate-900 transition-transform active:scale-95 active:bg-primary/10 dark:text-white",
          {
            "scale-95 bg-primary/10": activeKey === "Backspace",
          },
        )}
        onclick={() => handleBackspace({})}
      >
        <Delete />
      </button>
    </div>
    <DrawerFooter>
      {@render children?.({ onClose })}
    </DrawerFooter>
  </DrawerContent>
</Drawer>
