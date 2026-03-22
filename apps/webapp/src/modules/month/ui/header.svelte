<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, step, maxSteps, children } = $props<{
		title?: string;
		step: number;
		maxSteps: number;
		children?: Snippet;
	}>();
</script>

<header
	class="bg-background-light/80 fixed top-0 w-full left-0 right-0 p-4 z-10 dark:bg-background-dark/80 grid grid-cols-3 items-center backdrop-blur-md"
>
	{@render children?.()}
	<span
		class="flex-1 text-center text-nowrap text-lg leading-tight font-bold text-slate-800 dark:text-white"
		>{title}</span
	>
	<p
		class="ml-auto shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm leading-normal font-bold tracking-[0.015em] text-emerald-700 dark:bg-primary/20 dark:text-primary"
	>
		Step {step} of {maxSteps}
	</p>
</header>
