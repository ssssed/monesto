<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';


	let {class: className, ...props} = $props<{} & HTMLAttributes<HTMLDivElement>>();
</script>

<dt-p class={className} {...props}>
	<div class="mb-1 flex items-end justify-between">
		<p class="text-foreground text-base font-semibold dark:text-white">Distribution</p>
		<p class="text-muted-foreground text-xs font-medium dark:text-gray-400">50/30/20 Rule</p>
	</div>
	<!-- Multi-segment progress bar -->
	<div class="flex h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
		<div class="h-full bg-gray-800 dark:bg-gray-400" style="width: 50%"></div>
		<!-- Needs -->
		<div class="h-full bg-gray-400 dark:bg-gray-500" style="width: 30%"></div>
		<!-- Wants -->
		<div class="h-full bg-primary" style="width: 20%"></div>
		<!-- Goal -->
	</div>
	<div class="mt-1 flex justify-between px-1 text-xs">
		<div class="flex items-center gap-1.5">
			<div class="h-2 w-2 rounded-full bg-gray-800 dark:bg-gray-400"></div>
			<span class="text-muted-foreground dark:text-gray-400">Needs</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div class="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
			<span class="text-muted-foreground dark:text-gray-400">Wants</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div class="h-2 w-2 rounded-full bg-primary"></div>
			<span class="text-primary-dark font-medium dark:text-primary">Goal</span>
		</div>
	</div>
</dt-p>
