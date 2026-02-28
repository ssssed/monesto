<script lang="ts">
	import { Button, Carousel, type CarouselAPI } from '@monesto/ui-kit';
	import { ONBOARDING_STEPS, OnboardingCard } from '$lib/modules/onboarding';

	let api = $state<CarouselAPI>();
	let current = $state(0);
	let currentStep = $derived(ONBOARDING_STEPS[current]);

	const next = () => {
		api?.scrollNext();
	};

	$effect(() => {
		if (api) {
			current = api.selectedScrollSnap();
			api.on('select', () => {
				current = api!.selectedScrollSnap();
			});
		}
	});
</script>

<nav class="mb-10 flex w-full justify-end">
	<form method="POST" class="contents">
		<button
			type="submit"
			class="shrink-0 text-sm leading-normal font-semibold tracking-[0.015em] text-muted-foreground dark:text-[#8ab098]"
		>
			Skip
		</button>
	</form>
</nav>

<main class="flex w-full flex-1 flex-col items-center justify-center">
	<Carousel.Root
		class="flex w-full max-w-md flex-1 flex-col"
		opts={{
			align: 'start'
		}}
		setApi={(emblaApi) => (api = emblaApi)}
	>
		<Carousel.Content class="h-full">
			{#each ONBOARDING_STEPS as step (step.title)}
				<Carousel.Item>
					<OnboardingCard title={step.title} description={step.description} image={step.image} />
				</Carousel.Item>
			{/each}
		</Carousel.Content>

		<div class="z-10 mt-auto flex w-full flex-col items-center bg-transparent px-6 py-4">
			<Carousel.Pagination length={ONBOARDING_STEPS.length} />
			{#if currentStep.isFinal}
				<form method="POST" class="w-full">
					<Button
						type="submit"
						class="w-full text-lg font-bold tracking-wide text-[#053314]"
						size="extraLg"
					>
						{currentStep.buttonText}
						<currentStep.buttonIcon color="#053314" strokeWidth="3" />
					</Button>
				</form>
			{:else}
				<Button
					class="w-full text-lg font-bold tracking-wide text-[#053314]"
					size="extraLg"
					onclick={next}
				>
					{currentStep.buttonText}
				</Button>
			{/if}
		</div>
	</Carousel.Root>
</main>
