<script lang="ts">
	import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '$lib/components/ui/drawer';
	import { cn } from '$lib/utils';
	import { ArrowUp, Delete } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	/** Русские буквы по рядам (нижний регистр), как на стандартной iOS-клавиатуре. */
	const CYR_ROWS = [
		['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х'],
		['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
		['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю']
	] as const;

	/** Первая страница цифр и символов (как на iOS «123»). */
	const NUM_ROW_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;
	const NUM_ROW_SYM = ['-', '/', ':', ';', '(', ')', '₽', '&', '@', '"'] as const;
	const NUM_ROW_PUNCT = ['.', ',', '?', '!', "'"] as const;

	/** Вторая страница после «#+=». */
	const EXTRA_SYM_ROWS = [
		['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
		['_', '\\', '|', '~', '<', '>', '`', '•', '€', '£']
	] as const;
	const EXTRA_PUNCT = ['.', ',', '?', '!', "'"] as const;

	let {
		children,
		opened,
		onClose,
		onItemClick,
		onRemoveSymbol,
		title = '',
		onEnter
	} = $props<{
		opened: boolean;
		title?: string;
		onClose: () => void;
		onItemClick: (symbol: string) => void;
		onRemoveSymbol: () => void;
		onEnter?: () => void;
		children?: Snippet<[{ onClose: () => void }]>;
	}>();

	type KeyMode = 'letters' | 'numbers';

	let keyMode = $state<KeyMode>('letters');
	let numberPadPage = $state<1 | 2>(1);
	let shiftActive = $state(false);
	let activeKey = $state<string | null>(null);

	$effect(() => {
		if (!opened) {
			keyMode = 'letters';
			numberPadPage = 1;
			shiftActive = false;
		}
	});

	/**
	 * Краткая подсветка нажатой клавиши (и для экранной, и для физической клавиатуры).
	 * @param keyId — метка клавиши
	 */
	function flashKey(keyId: string) {
		activeKey = keyId;
		setTimeout(() => {
			activeKey = null;
		}, 120);
	}

	/**
	 * Вставляет букву с учётом Shift (кириллица).
	 * @param ch — символ в нижнем регистре
	 */
	function insertCyrillicLetter(ch: string) {
		const out = shiftActive ? ch.toLocaleUpperCase('ru-RU') : ch;
		onItemClick(out);
	}

	const handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
		e.stopPropagation();
	};

	/**
	 * Подтверждение ввода: опциональный `onEnter`, затем закрытие дроера.
	 */
	function confirmAndClose() {
		onEnter?.();
		onClose();
	}

	/**
	 * Обрабатывает нажатия физической клавиатуры, пока открыт дроер.
	 * @param e — событие клавиатуры
	 */
	function handlePhysicalKeyDown(e: KeyboardEvent) {
		flashKey(e.key);

		if (e.key === 'Backspace') {
			e.preventDefault();
			onRemoveSymbol();
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			confirmAndClose();
			return;
		}

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
			return;
		}

		if (e.ctrlKey || e.metaKey || e.altKey) return;

		if (e.key === ' ') {
			e.preventDefault();
			onItemClick(' ');
			return;
		}

		if (e.key.length === 1) {
			e.preventDefault();
			onItemClick(e.key);
		}
	}

	$effect(() => {
		if (!opened) return;

		const onKeyDown = (e: KeyboardEvent) => {
			handlePhysicalKeyDown(e);
		};

		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	});

	const keyNormal = cn(
		'flex min-h-[46px] min-w-0 flex-1 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-[17px] font-normal text-slate-900 shadow-sm transition-transform select-none active:scale-[0.97] dark:border-slate-600 dark:bg-slate-700 dark:text-white'
	);

	const keySpecial = cn(
		'flex min-h-[46px] min-w-0 items-center justify-center rounded-xl border border-slate-300/80 bg-slate-200/95 text-[15px] font-semibold text-slate-800 shadow-sm transition-transform select-none active:scale-[0.97] dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100'
	);

	const keyActive = 'scale-[0.97] bg-primary/15 ring-1 ring-primary/35 dark:bg-primary/20';

	const keySpace = cn(
		keyNormal,
		'flex-[1_1_auto] min-w-0 text-[15px] font-medium text-slate-500 dark:text-slate-400'
	);

	const keyOk = cn(
		keySpecial,
		'min-w-[62px] shrink-0 bg-primary/90 px-2.5 text-[16px] font-bold text-primary-foreground shadow-md active:scale-[0.97] dark:bg-primary dark:text-primary-foreground'
	);
</script>

<Drawer open={opened} {onClose}>
	<DrawerContent class="bg-slate-100/95 dark:bg-muted/95" onclick={handleClick}>
		<DrawerHeader class="pb-2">
			<DrawerTitle>
				{#if title.length > 0}
					<p class="line-clamp-2 text-center text-base font-medium text-slate-700 dark:text-slate-200">
						{title}
					</p>
				{/if}
			</DrawerTitle>
		</DrawerHeader>

		<div class="flex flex-col gap-1 px-1.5 pb-2">
			{#if keyMode === 'letters'}
				<!-- Ряд 1 -->
				<div class="flex gap-1">
					{#each CYR_ROWS[0] as ch (ch)}
						<button
							type="button"
							class={cn(keyNormal, activeKey === ch && keyActive)}
							onclick={() => {
								flashKey(ch);
								insertCyrillicLetter(ch);
							}}
						>
							{shiftActive ? ch.toLocaleUpperCase('ru-RU') : ch}
						</button>
					{/each}
				</div>
				<!-- Ряд 2 (смещение как на iOS) -->
				<div class="flex gap-1 px-1.5">
					{#each CYR_ROWS[1] as ch (ch)}
						<button
							type="button"
							class={cn(keyNormal, activeKey === ch && keyActive)}
							onclick={() => {
								flashKey(ch);
								insertCyrillicLetter(ch);
							}}
						>
							{shiftActive ? ch.toLocaleUpperCase('ru-RU') : ch}
						</button>
					{/each}
				</div>
				<!-- Ряд 3: Shift + буквы + удаление -->
				<div class="flex gap-1">
					<button
						type="button"
						class={cn(keySpecial, 'w-[54px] shrink-0', shiftActive && keyActive)}
						aria-pressed={shiftActive}
						aria-label="Shift"
						onclick={() => (shiftActive = !shiftActive)}
					>
						<ArrowUp class="size-[22px]" />
					</button>
					{#each CYR_ROWS[2] as ch (ch)}
						<button
							type="button"
							class={cn(keyNormal, activeKey === ch && keyActive)}
							onclick={() => {
								flashKey(ch);
								insertCyrillicLetter(ch);
							}}
						>
							{shiftActive ? ch.toLocaleUpperCase('ru-RU') : ch}
						</button>
					{/each}
					<button
						type="button"
						class={cn(keySpecial, 'w-[54px] shrink-0', activeKey === 'Backspace' && keyActive)}
						aria-label="Удалить"
						onclick={() => {
							flashKey('Backspace');
							onRemoveSymbol();
						}}
					>
						<Delete class="size-[22px]" />
					</button>
				</div>
			{:else if numberPadPage === 1}
				<div class="flex gap-1">
					{#each NUM_ROW_DIGITS as sym (sym)}
						<button
							type="button"
							class={cn(keyNormal, activeKey === sym && keyActive)}
							onclick={() => {
								flashKey(sym);
								onItemClick(sym);
							}}
						>
							{sym}
						</button>
					{/each}
				</div>
				<div class="flex gap-1">
					{#each NUM_ROW_SYM as sym (sym)}
						<button
							type="button"
							class={cn(keyNormal, activeKey === sym && keyActive)}
							onclick={() => {
								flashKey(sym);
								onItemClick(sym);
							}}
						>
							{sym}
						</button>
					{/each}
				</div>
				<div class="flex gap-1">
					<button
						type="button"
						class={cn(keySpecial, 'min-w-[60px] shrink-0 px-1 text-[13px]', activeKey === '#+=' && keyActive)}
						onclick={() => {
							flashKey('#+=');
							numberPadPage = 2;
						}}
					>
						#+=
					</button>
					{#each NUM_ROW_PUNCT as sym (sym)}
						<button
							type="button"
							class={cn(keyNormal, activeKey === sym && keyActive)}
							onclick={() => {
								flashKey(sym);
								onItemClick(sym);
							}}
						>
							{sym}
						</button>
					{/each}
					<button
						type="button"
						class={cn(keySpecial, 'w-[54px] shrink-0', activeKey === 'Backspace' && keyActive)}
						aria-label="Удалить"
						onclick={() => {
							flashKey('Backspace');
							onRemoveSymbol();
						}}
					>
						<Delete class="size-[22px]" />
					</button>
				</div>
			{:else}
				{#each EXTRA_SYM_ROWS as row, ri (ri)}
					<div class="flex gap-1">
						{#each row as sym (sym)}
							<button
								type="button"
								class={cn(keyNormal, activeKey === sym && keyActive)}
								onclick={() => {
									flashKey(sym);
									onItemClick(sym);
								}}
							>
								{sym}
							</button>
						{/each}
					</div>
				{/each}
				<div class="flex gap-1">
					<button
						type="button"
						class={cn(keySpecial, 'min-w-[60px] shrink-0 text-[15px]', activeKey === '123' && keyActive)}
						onclick={() => {
							flashKey('123');
							numberPadPage = 1;
						}}
					>
						123
					</button>
					{#each EXTRA_PUNCT as sym (sym)}
						<button
							type="button"
							class={cn(keyNormal, activeKey === sym && keyActive)}
							onclick={() => {
								flashKey(sym);
								onItemClick(sym);
							}}
						>
							{sym}
						</button>
					{/each}
					<button
						type="button"
						class={cn(keySpecial, 'w-[54px] shrink-0', activeKey === 'Backspace' && keyActive)}
						aria-label="Удалить"
						onclick={() => {
							flashKey('Backspace');
							onRemoveSymbol();
						}}
					>
						<Delete class="size-[22px]" />
					</button>
				</div>
			{/if}

			<!-- Нижний ряд: только 123 / АБВ, длинный пробел, OK (без эмодзи и системной полосы) -->
			<div class="mt-0.5 flex gap-1">
				{#if keyMode === 'letters'}
					<button
						type="button"
						class={cn(keySpecial, 'min-w-[60px] shrink-0 text-[15px]', activeKey === 'mode-123' && keyActive)}
						onclick={() => {
							flashKey('mode-123');
							keyMode = 'numbers';
							numberPadPage = 1;
							shiftActive = false;
						}}
					>
						123
					</button>
				{:else}
					<button
						type="button"
						class={cn(keySpecial, 'min-w-[60px] shrink-0 text-[13px] leading-tight', activeKey === 'АБВ' && keyActive)}
						onclick={() => {
							flashKey('АБВ');
							keyMode = 'letters';
							numberPadPage = 1;
						}}
					>
						АБВ
					</button>
				{/if}
				<button
					type="button"
					class={cn(keySpace, activeKey === ' ' && keyActive)}
					aria-label="Пробел"
					onclick={() => {
						flashKey(' ');
						onItemClick(' ');
					}}
				>
					пробел
				</button>
				<button
					type="button"
					class={cn(keyOk, activeKey === 'OK' && 'ring-2 ring-primary-foreground/30')}
					onclick={() => {
						flashKey('OK');
						confirmAndClose();
					}}
				>
					OK
				</button>
			</div>
		</div>

		<DrawerFooter class="pt-0">
			{@render children?.({ onClose })}
		</DrawerFooter>
	</DrawerContent>
</Drawer>
