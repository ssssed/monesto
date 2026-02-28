<script lang="ts">
	import { cn } from '@monesto/ui-kit';
	import type { Snippet } from 'svelte';

	let { isSelected, title, description, children, onClick } = $props<{
		isSelected?: boolean;
		title: string;
		description: string;
		children: Snippet;
		onClick?: () => void;
	}>();
</script>

<button
	type="button"
	class={cn(
		'grid grid-cols-[auto_1fr] grid-rows-2 gap-x-4 gap-y-1 rounded-2xl border border-transparent bg-white p-4',
		{
			'border-2 border-primary': isSelected
		}
	)}
	onclick={onClick}
>
	<div class="row-span-2 flex max-w-6 items-center justify-center text-primary">
		{@render children?.()}
	</div>
	<h4 class="mb-1 truncate text-left text-lg leading-tight font-semibold text-[#111813]">{title}</h4>
	<p class="line-clamp-2 text-sm text-left leading-normal font-medium text-[#61896f]">
		{description}
	</p>
</button>
