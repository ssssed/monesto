<script lang="ts">
	import { Page } from '@monesto/ui-kit';
	import { defineMonthStateMachine, stepStore } from '../model/model.svelte';
	import Header from '../ui/header.svelte';

	const { currentStep, handleNext, handlePrev, maxSteps } = defineMonthStateMachine();

	$inspect(stepStore);
</script>

<Page>
	<Header title={currentStep.header?.title} step={currentStep.step} {maxSteps}>
		{#if currentStep.header?.leftIcon}
			<currentStep.header.leftIcon onclick={handlePrev} />
		{/if}
	</Header>

	<currentStep.component
		onNext={handleNext}
		onPrev={handlePrev}
		hasNext={currentStep.hasNext}
		hasPrev={currentStep.hasPrev}
	/>
</Page>
