<script lang="ts">
	import MandatoryInput from '../ui/custom-input.svelte';
	import ContinueButton from '../ui/continue-button.svelte';
	import type { StepProps } from '../types';
	import { SUGGESTS } from '../model/constants';
	import Suggest from '../ui/suggest.svelte';
	import { monthStore } from '../model/model.svelte';

	let { onNext }: StepProps = $props();
</script>

<div class="flex flex-1 flex-col items-center justify-center">
	<h2
		class="mb-1 text-center text-lg leading-tight font-bold tracking-tight text-slate-900 dark:text-white"
	>
		Mandatory Expenses
	</h2>
	<p class="mb-8 text-center text-sm leading-normal font-medium text-slate-500 dark:text-slate-400">
		Your regular monthly costs
	</p>
	<MandatoryInput bind:value={monthStore.mandatory.value} onEnter={onNext}>
		<ContinueButton disabled={monthStore.mandatory.value.length === 0} onclick={onNext} />
	</MandatoryInput>
	<div class="flex w-full max-w-xs flex-wrap justify-center gap-2">
		{#each SUGGESTS as suggest (suggest)}
			<Suggest>{suggest}</Suggest>
		{/each}
	</div>
</div>

<ContinueButton disabled={monthStore.mandatory.value.length === 0} onclick={onNext} />
