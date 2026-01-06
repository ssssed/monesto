<script lang="ts">
	import * as Drawer from '$lib/shared/ui/drawer';
	import { cn } from '$lib/shared/utils';
	import { Delete } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	let { children, opened, onClose, onItemClick, onRemoveSymbol, title, onEnter } = $props<{
		children: Snippet;
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

	function pressKey(key: string) {
		activeKey = key;
		setTimeout(() => (activeKey = null), 120);
	}

	const handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
		e.stopPropagation();
	};

	function handleInput(symbol: string) {
		onItemClick(symbol);
	}

	function handleBackspace() {
		onRemoveSymbol();
	}

	$effect(() => {
		if (!opened) return;

		const onKeyDown = (e: KeyboardEvent) => {
			pressKey(e.key);
			// цифры
			if (/^[0-9]$/.test(e.key)) {
				e.preventDefault();
				handleInput(e.key);
				return;
			}

			// точка
			if (e.key === '.') {
				e.preventDefault();
				handleInput('.');
				return;
			}

			// backspace
			if (e.key === 'Backspace') {
				e.preventDefault();
				handleBackspace();
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

<Drawer.Root open={opened} {onClose}>
	<Drawer.Content onclick={handleClick}>
		<Drawer.Header>
			<Drawer.Title>
				{#if title.length > 1}
					<p class="text-center text-lg">
						{title}
					</p>
				{/if}
			</Drawer.Title>
		</Drawer.Header>
		<div class="grid grid-cols-3 gap-x-6 gap-y-4">
			{#each number as number (number)}
				<button
					class={cn(
						'keypad-btn flex h-14 items-center justify-center rounded-xl text-2xl font-medium text-slate-900 transition-transform active:scale-95 active:bg-primary/10 dark:text-white',
						{
							'scale-95 bg-primary/10': activeKey === number
						}
					)}
					onclick={() => handleInput(number)}>{number}</button
				>
			{/each}
			<button
				class={cn(
					'keypad-btn flex h-14 items-center justify-center rounded-xl text-slate-900 transition-transform active:scale-95 active:bg-primary/10 dark:text-white',
					{
						'scale-95 bg-primary/10': activeKey === 'Backspace'
					}
				)}
				onclick={handleBackspace}
			>
				<Delete />
			</button>
		</div>
		<Drawer.Footer>
			{@render children?.()}
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
