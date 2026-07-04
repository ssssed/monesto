<script lang="ts">
	import { DEFAULT_STEP_NAME, STEPS, stepStore, type StepName } from '../model/model.svelte';
	import Header from '../ui/header.svelte';

	let step = $state<StepName>(DEFAULT_STEP_NAME);
	const currentStep = $derived(STEPS[step] ?? STEPS[DEFAULT_STEP_NAME]);
	const maxSteps = Object.keys(STEPS).length;

	const handleNext = async () => {
		if (!currentStep.next) return;

		await currentStep.onNext?.(stepStore);
		step = currentStep.next;
	};

	const handlePrev = () => {
		if (!currentStep.prev) return;

		currentStep.onPrev?.();
		step = currentStep.prev;
	};

	const handleFinal = async () => {
		await currentStep.onNext?.(stepStore);
	};
</script>

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
	onNext={currentStep.isFinal ? handleFinal : handleNext}
	onPrev={handlePrev}
	hasNext={currentStep.next != null}
	hasPrev={currentStep.prev != null}
/>
