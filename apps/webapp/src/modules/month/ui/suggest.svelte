<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children } = $props<{
		children: Snippet;
	}>();
</script>

<div
	class="flex items-center justify-center px-4 py-2 rounded-full bg-surface-light dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm"
>
	<span class="text-slate-600 dark:text-slate-300 text-[14px] font-medium"
		>{@render children?.()}</span
	>
</div>
