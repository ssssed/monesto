<script lang="ts">
	import { Page } from '@monesto/ui-kit';
	import { DEFAULT_STEP_NAME, STEPS, type StepName } from '../model/model.svelte';
	import Header from '../ui/header.svelte';

	let step = $state<StepName>(DEFAULT_STEP_NAME);
	const currentStep = $derived(STEPS[step] ?? STEPS[DEFAULT_STEP_NAME]);
	const maxSteps = Object.keys(STEPS).length;

	const handleNext = () => {
		if (!currentStep.next) return;

		currentStep.onNext?.();
		step = currentStep.next;
	};

	const handlePrev = () => {
		if (!currentStep.prev) return;

		currentStep.onPrev?.();
		step = currentStep.prev;
	};
</script>

<Page>
	<Header title={currentStep.header?.title} step={currentStep.step} {maxSteps}>
		<div>
			{#if currentStep.header}
				{@const LeftIcon = currentStep.header.leftIcon}
				{#if LeftIcon}
					<LeftIcon onclick={handlePrev} />
				{/if}
			{/if}
		</div>
	</Header>

	<currentStep.component
		onNext={handleNext}
		onPrev={handlePrev}
		hasNext={currentStep.next != null}
		hasPrev={currentStep.prev != null}
	/>
</Page>
