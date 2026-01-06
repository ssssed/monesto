<script>
	import Button from '$lib/shared/ui/button/button.svelte';
	import { ArrowRight } from "@lucide/svelte";
	import * as Carousel from "$lib/shared/ui/carousel";
	import { ONBOARDING_STEPS, OnboardingCard } from '$lib/modules/onboarding';

</script>
<nav class="flex w-full justify-end mb-10">
	<a href="/" class="text-muted-foreground dark:text-[#8ab098] text-sm font-semibold leading-normal tracking-[0.015em] shrink-0">Skip</a>
</nav>

<main class="flex-1 flex flex-col items-center justify-center w-full">
	<Carousel.Root class="w-full max-w-md flex flex-col flex-1" opts={{
    align: "start",
  }}>
		<Carousel.Content class="h-full">
			{#each ONBOARDING_STEPS as step (step.title)}
				<Carousel.Item >
					<OnboardingCard title={step.title} description={step.description} image={step.image} />
				</Carousel.Item>
			{/each}
		</Carousel.Content>
		
		<div class="w-full flex flex-col items-center py-4 px-6 bg-transparent z-10 mt-auto">
			<Carousel.Pagination length={3} />
			<Button class="w-full" size="extraLg">
				<span class="text-[#053314] text-lg font-bold tracking-wide">
					Get Started
				</span>
				<ArrowRight color="#053314" strokeWidth=3 />
			</Button>
		</div>
	</Carousel.Root>
	</main>