<script lang="ts">
	import type { MonthStatus } from '../api';
	import { initMountStatusStore, STEPS, type NewMonthStepType } from '../model/model.svelte';
	import NewMonthHeader from '../ui/new-month-header.svelte';

	let { monthStatus }: { monthStatus: MonthStatus } = $props();

	let stepStage = $state<NewMonthStepType>('incoming');
	let step = $derived(STEPS[stepStage]);

	const handleNext = () => {
		if (!step.next) return;

		step?.onNext?.();
		stepStage = step.next;
	};

	const handlePrev = () => {
		if (!step.prev) return;

		step?.onPrev?.();
		stepStage = step.prev;
	};

	initMountStatusStore(monthStatus);
</script>

<main
	class="font-display flex flex-1 flex-col overflow-y-auto bg-background antialiased transition-colors duration-300"
>
	<NewMonthHeader title={step.title} step={step.step} maxSteps={Object.keys(STEPS).length}>
		<step.headerActionButton.icon
			onclick={() => {
				if (step.headerActionButton.type === 'back') handlePrev();
			}}
		/>
	</NewMonthHeader>

	<step.component
		onNext={handleNext}
		onPrev={handlePrev}
		hasNext={!!step.next}
		hasPrev={!!step.prev}
		{monthStatus}
	/>

	<div
		class="pointer-events-none fixed top-1/4 left-1/2 -z-10 h-125 w-125 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/5"
		data-alt="Soft green ambient light glow in background"
	></div>
</main>
