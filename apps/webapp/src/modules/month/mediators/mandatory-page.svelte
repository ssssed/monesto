<script lang="ts">
	import { NumberInput } from '@monesto/ui-kit';
	import { SUGGESTS } from '../model/constants';
	import { stepStore, type StepProps } from '../model/model.svelte';
	import ContinueButton from '../ui/continue-button.svelte';
	import Suggest from '../ui/suggest.svelte';
	import ToDetailed from '../ui/to-detailed.svelte';

	let { onNext }: StepProps = $props();
</script>

<div class="flex flex-1 flex-col items-center justify-center">
	<h2
		class="mb-1 text-center text-3xl leading-tight font-bold tracking-tight text-slate-900 dark:text-white"
	>
		Mandatory Expenses
	</h2>
	<p
		class="mb-8 text-center text-base leading-normal font-medium text-slate-500 dark:text-slate-400"
	>
		Your regular monthly costs
	</p>
	<NumberInput bind:value={stepStore.mandatory.value} onEnter={onNext} prefix="₽" size="lg">
		<ContinueButton disabled={stepStore.mandatory.value.length === 0} onclick={onNext} />
	</NumberInput>
	<div class="flex w-full max-w-xs flex-wrap justify-center gap-2">
		{#each SUGGESTS as suggest (suggest)}
			<Suggest>{suggest}</Suggest>
		{/each}
	</div>
	<ToDetailed>To detailed your expenses</ToDetailed>
</div>

<ContinueButton disabled={stepStore.mandatory.value.length === 0} onclick={onNext} />
