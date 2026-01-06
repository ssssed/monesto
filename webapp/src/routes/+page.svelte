<script lang="ts">
	import { getMonthStatus } from '$lib/modules/month';
	import ContinueButton from '$lib/modules/month/ui/continue-button.svelte';
	import IncomeInput from '$lib/modules/month/ui/income-input.svelte';
	import { History, Wallet, X, TrendingUp } from '@lucide/svelte';

	let inputValue = $state<string>('');
</script>

{#await getMonthStatus()}
	Loading...
{:then monthStatus}
	{#if monthStatus.isMonthComplete}
		Complete...
	{:else}
		<main
			class="font-display flex flex-1 flex-col overflow-y-auto bg-background antialiased transition-colors duration-300"
		>
			<header
				class="bg-background-light/80 dark:bg-background-dark/80 grid grid-cols-3 items-center backdrop-blur-md"
			>
				<X />
				<span
					class="flex-1 text-center text-lg leading-tight font-bold text-slate-800 dark:text-white"
					>New Month</span
				>
				<p
					class="ml-auto shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm leading-normal font-bold tracking-[0.015em] text-emerald-700 dark:bg-primary/20 dark:text-primary"
				>
					Step 1 of 3
				</p>
			</header>
			<div class="flex flex-1 flex-col items-center justify-center">
				<div class="mb-8 flex max-w-md flex-col gap-4 text-center">
					<div
						class="bg-surface-light dark:bg-surface-dark mx-auto mb-2 flex size-14 items-center justify-center rounded-full shadow-sm ring-1 ring-slate-100 dark:ring-white/5"
					>
						<Wallet size={30} color="#13ec5b" />
					</div>
					<h3
						class="px-4 text-3xl leading-tight font-bold tracking-tight text-slate-900 dark:text-white"
					>
						Enter how much you receive this month
					</h3>
					<p class="text-base font-normal text-slate-500 dark:text-slate-400">
						This helps us calculate your budget plan.
					</p>
				</div>

				<IncomeInput bind:value={inputValue} />

				<div class="animate-pulse-slow flex w-full max-w-md flex-wrap justify-center gap-3 p-3">
					<button
						class="group bg-surface-light dark:bg-surface-dark flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl pr-5 pl-4 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-primary/5 hover:ring-primary dark:ring-white/10 dark:hover:bg-white/5"
					>
						<span class="text-lg text-slate-400 group-hover:text-primary dark:text-slate-500">
							<History />
						</span>
						<p class="text-sm leading-normal font-medium text-slate-700 dark:text-slate-200">
							Last Month: $3,200
						</p>
					</button>
					<button
						class="group bg-surface-light dark:bg-surface-dark flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl pr-5 pl-4 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-primary/5 hover:ring-primary dark:ring-white/10 dark:hover:bg-white/5"
					>
						<span class="text-lg text-slate-400 group-hover:text-primary dark:text-slate-500">
							<TrendingUp />
						</span>
						<p class="text-sm leading-normal font-medium text-slate-700 dark:text-slate-200">
							Average: $3,050
						</p>
					</button>
				</div>
			</div>

			<ContinueButton disabled={inputValue.length === 0} />

			<div
				class="pointer-events-none fixed top-1/4 left-1/2 -z-10 h-125 w-125 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/5"
				data-alt="Soft green ambient light glow in background"
			></div>
		</main>
	{/if}
{/await}

<style>
	/* Subtle pulse animation for the focus state */
	@keyframes pulse-subtle {
		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.8;
		}
	}

	.animate-pulse-slow {
		animation: pulse-subtle 3s infinite;
	}

	.disable-overflow {
		overflow: auto !important;
	}
</style>
