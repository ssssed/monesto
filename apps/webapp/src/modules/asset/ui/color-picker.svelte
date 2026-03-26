<script lang="ts">
	import { cn } from '@monesto/ui-kit';

	let {
		currentColor = $bindable<string>(),
		colors = $bindable<string[]>([]),
		title,
		selectedItemBorderColor,
		class: className
	} = $props<{
		currentColor: string;
		colors: string[];
		title: string;
		selectedItemBorderColor: string;
		class?: string;
	}>();
</script>

<section class={cn('flex flex-col gap-2.5', className)}>
	<p class="text-[#64748B] text-[13px] font-medium">{title}</p>
	<div class="flex items-center gap-2">
		{#each colors as color}
			<button
				aria-label={color}
				aria-pressed={currentColor === color}
				aria-roledescription="Color picker button"
				type="button"
				class="rounded-full outline-2"
				style={`background-color: ${color}; outline-color: ${currentColor === color ? selectedItemBorderColor : 'transparent'}`}
				onclick={() => (currentColor = color)}
			>
				<div class="w-7 h-7 rounded-full" style={`background-color: ${color}`}></div>
			</button>
		{/each}
	</div>
</section>
