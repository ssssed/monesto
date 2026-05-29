<script lang="ts">
	import {
		Button,
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselPagination,
		type CarouselAPI
	} from '@monesto/ui-kit';
	import { ONBOARDING_STEPS } from '../config';

	let api = $state<CarouselAPI | undefined>();
	let current = $state(0);
	let currentStep = $derived(ONBOARDING_STEPS[current]);

	/**
	 * Синхронизирует активный индекс шага с текущим слайдом карусели.
	 */
	const syncCurrentStep = () => {
		current = api?.selectedScrollSnap() ?? 0;
	};

	/**
	 * Переключает карусель на следующий шаг onboarding.
	 */
	const next = () => {
		api?.scrollNext();
	};

	/**
	 * Сохраняет экземпляр API карусели для управления шагами.
	 * @param props Экземпляр Carousel API.
	 */
	const setCarouselApi = (props: CarouselAPI | undefined) => {
		api?.off('select', syncCurrentStep);
		api = props;
		syncCurrentStep();
		api?.on('select', syncCurrentStep);
	};
</script>

<div class="flex h-full w-full max-w-md flex-col flex-1">
	<nav class="mb-10 flex w-full shrink-0 justify-end">
		<form method="POST" class="contents">
			<button
				type="submit"
				class="shrink-0 text-sm leading-normal font-semibold tracking-[0.015em] text-muted-foreground dark:text-[#8ab098]"
			>
				Skip
			</button>
		</form>
	</nav>

	<Carousel
		class="flex min-h-0 w-full flex-1 flex-col"
		opts={{
			align: 'start'
		}}
		setApi={setCarouselApi}
	>
		<CarouselContent class="min-h-0 flex-1">
			{#each ONBOARDING_STEPS as step (step.id)}
				<CarouselItem class="h-full">
					<div class="h-full">
						<step.component />
					</div>
				</CarouselItem>
			{/each}
		</CarouselContent>
	</Carousel>
	<div class="z-10 mt-auto flex w-full shrink-0 flex-col items-center bg-transparent px-6 py-4">
		<CarouselPagination length={ONBOARDING_STEPS.length} {current} />
		{#if currentStep.isFinal}
			<form method="POST" class="w-full">
				<Button
					type="submit"
					class="w-full text-lg font-bold tracking-wide text-[#053314]"
					size="extraLg"
				>
					{currentStep.buttonText}
					{#if currentStep.buttonIcon}
						<currentStep.buttonIcon color="#053314" strokeWidth="3" />
					{/if}
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
</div>
