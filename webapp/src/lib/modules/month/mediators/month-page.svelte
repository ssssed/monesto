<script lang="ts">
	import type { Component } from 'svelte';
	import { STEPS, type NewMonthStepType } from '../constants';
	import NewMonthHeader from '../ui/new-month-header.svelte';
	import type { StepProps } from '../types';

	let stepStage = $state<NewMonthStepType>('incoming');
	let step = $derived(STEPS[stepStage]);

	const handleNext = () => {
		if (!step.next) return;

		stepStage = step.next;
	};

	const handlePrev = () => {
		if (!step.prev) return;

		stepStage = step.prev;
	};
</script>

<main
	class="font-display flex flex-1 flex-col overflow-y-auto bg-background antialiased transition-colors duration-300"
>
	<NewMonthHeader title="New Month" step={step.step} maxSteps={Object.keys(STEPS).length}>
		<svelte:component
			this={step.headerActionButton.icon}
			onclick={() => {
				if (step.headerActionButton.type === 'back') handlePrev();
			}}
		/>
	</NewMonthHeader>

	<svelte:component
		this={step.component as Component<StepProps>}
		onNext={handleNext}
		onPrev={handlePrev}
		hasNext={!!step.next}
		hasPrev={!!step.prev}
	/>

	<div
		class="pointer-events-none fixed top-1/4 left-1/2 -z-10 h-125 w-125 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/5"
		data-alt="Soft green ambient light glow in background"
	></div>
</main>
