<script lang="ts">
	import * as Drawer from '$lib/shared/ui/drawer';
	import { Delete } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	let { children, opened, onClose, onItemClick, onRemoveSymbol, title } = $props<{
		children: Snippet;
		ref?: HTMLElement | null;
		opened: boolean;
		title?: string;
		onClose: () => void;
		onItemClick: (symbol: string) => void;
		onRemoveSymbol: () => void;
	}>();

	const number = [...Array.from({ length: 9 }, (_, i) => String(i + 1)), '.', '0'];

	const handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
		e.stopPropagation();
	};
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
					class="keypad-btn flex h-14 items-center justify-center rounded-xl text-2xl font-medium text-slate-900 transition-transform dark:text-white"
					onclick={() => onItemClick(number)}>{number}</button
				>
			{/each}
			<button
				class="keypad-btn flex h-14 items-center justify-center rounded-xl text-slate-900 transition-transform dark:text-white"
				onclick={onRemoveSymbol}
			>
				<Delete />
			</button>
		</div>
		<Drawer.Footer>
			{@render children?.()}
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
