<script lang="ts">
	import { STRATEGIES } from '../model/constants';
	import { monthStore } from '../model/model.svelte';
	import type { StepProps } from '../types';
	import ContinueButton from '../ui/continue-button.svelte';
	import StrategyCard from '../ui/strategy-card.svelte';

	let { onNext, hasNext }: StepProps = $props();
</script>

<div class="flex flex-1 flex-col mt-11.25">
	<h1
		class="text-text-main-light dark:text-text-main-dark mt-4 mb-3 text-left text-3xl leading-tight font-bold tracking-tight"
	>
		Choose Your Goal
	</h1>
	<p
		class="text-text-sub-light dark:text-text-sub-dark max-w-[90%] text-left text-base leading-relaxed font-normal"
	>
		Let's define what we are working towards today. Select the path that fits you best.
	</p>

	<div class="mt-8 flex flex-col gap-4">
		{#each STRATEGIES as strategy (strategy.name)}
			<StrategyCard
				title={strategy.title}
				description={strategy.description}
				isSelected={strategy.name === monthStore.strategy.selectedName}
				onClick={() => {
					monthStore.strategy.selectedName = strategy.name;
				}}
			>
			<strategy.icon />
			</StrategyCard>
		{/each}
	</div>

	{#if hasNext}
		<ContinueButton
			class="mt-auto"
			disabled={monthStore.mandatory.value.length === 0}
			onclick={onNext}
		/>
	{/if}
</div>
