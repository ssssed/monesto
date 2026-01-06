<script lang="ts">
	import { Wallet } from '@lucide/svelte';
	import IncomeInput from '../ui/custom-input.svelte';
	import RecentInfo from '../ui/recent-info.svelte';
	import ContinueButton from '../ui/continue-button.svelte';
	import type { StepProps } from '../types';
	import { monthStore } from '../model.svelte';

	let { onNext, monthStatus }: StepProps = $props();
</script>

<div class="flex flex-1 flex-col items-center justify-center">
	<div class="mb-8 flex max-w-md flex-col gap-4 text-center">
		<div
			class="bg-surface-light dark:bg-surface-dark mx-auto mb-2 flex size-14 items-center justify-center rounded-full shadow-sm ring-1 ring-slate-100 dark:ring-white/5"
		>
			<Wallet size={30} color="#13ec5b" />
		</div>
		<h3 class="px-4 text-3xl leading-tight font-bold tracking-tight text-slate-900 dark:text-white">
			Enter how much you receive this month
		</h3>
		<p class="text-base font-normal text-slate-500 dark:text-slate-400">
			This helps us calculate your budget plan.
		</p>
	</div>

	<IncomeInput bind:value={monthStore.incoming.value} onEnter={onNext}>
		<ContinueButton disabled={monthStore.incoming.value.length === 0} onclick={onNext} />
	</IncomeInput>

	{#if monthStatus.recentInfo}
		<div class="flex w-full max-w-md flex-wrap justify-center gap-3 p-3">
			{#if monthStatus.recentInfo['last-incoming']}
				<RecentInfo
					type="last"
					price={monthStatus.recentInfo['last-incoming'].amount}
					currency={monthStatus.recentInfo['last-incoming'].currency}
					bind:value={monthStore.incoming.value}
				/>
			{/if}
			{#if monthStatus.recentInfo.average}
				<RecentInfo
					type="average"
					price={monthStatus.recentInfo.average.amount}
					currency={monthStatus.recentInfo.average.currency}
					disabled
				/>
			{/if}
		</div>
	{/if}
</div>

<ContinueButton disabled={monthStore.incoming.value.length === 0} onclick={onNext} />
