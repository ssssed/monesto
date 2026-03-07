<script lang="ts">
	let { image, title, description } = $props<{
		image: string;
		title: string;
		description: string;
	}>();
</script>

<div
	class="w-full mx-auto px-6 py-10 rounded-2xl overflow-hidden bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center mb-8 relative select-none"
>
	<img
		class="w-full max-w-[320px] aspect-square bg-center bg-contain bg-no-repeat"
		src={image}
		alt={title}
	/>
</div>
<div class="select-none">
	<h1
		class="text-foreground mb-2 dark:text-white text-center tracking-tight text-[28px] md:text-[32px] font-bold leading-tight"
	>
		{title}
	</h1>
	<p
		class="text-muted-foreground px-2 dark:text-[#a3c2af] text-base text-center font-medium leading-relaxed"
	>
		{description}
	</p>
</div>
