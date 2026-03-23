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

	const keyNormal = cn(
		'flex min-h-[46px] w-full items-center justify-center rounded-xl border border-slate-200/90 bg-white text-[17px] font-normal text-slate-900 shadow-sm transition-transform select-none active:scale-[0.97] dark:border-slate-600 dark:bg-slate-700 dark:text-white'
	);

	const keySpecial = cn(
		'flex min-h-[46px] w-full items-center justify-center rounded-xl border border-slate-300/80 bg-slate-200/95 text-slate-800 shadow-sm transition-transform select-none active:scale-[0.97] dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100'
	);

	const keyActive = 'scale-[0.97] bg-primary/15 ring-1 ring-primary/35 dark:bg-primary/20';

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
	<DrawerContent class="bg-slate-100/95 dark:bg-muted/95" onclick={handleClick}>
		<DrawerHeader class="pb-2">
			<DrawerTitle>
				{#if title != null && title.length > 0}
					<p class="line-clamp-2 text-center text-base font-medium text-slate-700 dark:text-slate-200">
						{title}
					</p>
				{/if}
			</DrawerTitle>
		</DrawerHeader>
		<div class="grid grid-cols-3 gap-1.5 px-1.5 pb-2">
			{#each number as number (number)}
				<button
					type="button"
					class={cn(keyNormal, activeKey === number && keyActive)}
					onclick={() => {
						pressKey({ keyId: number });
						handleInput({ symbol: number });
					}}
				>
					{number}
				</button>
			{/each}
			<button
				type="button"
				class={cn(keySpecial, activeKey === 'Backspace' && keyActive)}
				aria-label="Удалить"
				onclick={() => {
					pressKey({ keyId: 'Backspace' });
					handleBackspace({});
				}}
			>
				<Delete class="size-[22px]" />
			</button>
		</div>
		<DrawerFooter class="pt-0">
			{@render children?.({ onClose })}
		</DrawerFooter>
	</DrawerContent>
</Drawer>
