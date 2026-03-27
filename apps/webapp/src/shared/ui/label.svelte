<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, name, description } = $props<{
		children: Snippet;
		name: string;
		description?: string;
	}>();
</script>

<div class="flex flex-col gap-1.5">
	<p class="text-[#64748B] text-[13px] font-medium">{name}</p>
	{@render children?.()}
	{#if description}
		<p class="text-[#94A3B8] text-[11px]">{description}</p>
	{/if}
</div>
