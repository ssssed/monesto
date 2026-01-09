<script lang="ts">
	import { cn } from '$lib/shared/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, class: className, ...props } = $props<{
		children: Snippet;
	} & HTMLAttributes<HTMLDivElement>>();
</script>

<main
	class={cn("font-display flex flex-1 flex-col overflow-y-auto bg-background antialiased transition-colors duration-300", className)}
	{...props}
>
	{@render children?.()}
</main>
