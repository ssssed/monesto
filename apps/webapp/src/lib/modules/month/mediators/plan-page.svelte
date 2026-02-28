<script lang="ts">
	import { ROUTER } from '$lib/shared/config/router';
	import { Button, Header, Page } from '@monesto/ui-kit';
	import { Settings } from '@lucide/svelte';
	import type { MonthStatus } from '../api';
	import Distribution from '../ui/distribution.svelte';

	let { monthStatus }: { monthStatus: MonthStatus } = $props();
	const { incoming, mandatory } = monthStatus;

	const amount = parseFloat(incoming) - parseFloat(mandatory);
</script>

<Page class="mt-18">
	<Header>
		<h2 class="text-center text-lg leading-tight font-bold text-slate-800 dark:text-white">October Plan</h2>

		{#snippet right()}
			<a
				class="ml-auto p-2"
				href={ROUTER.home}
				aria-label="Settings"
			>
				<Settings />
			</a>
		{/snippet}
	</Header>

	<div class="flex flex-col items-center gap-4 p-4">
		<p class="text-muted-foreground mb-1 text-sm font-medium dark:text-gray-400">Total Monthly Income</p>
		<h1 class="text-foreground text-[40px] leading-tight font-bold tracking-tight dark:text-white">
			${amount.toFixed(2)}
		</h1>
	</div>

	<Distribution class="mb-8 flex flex-col gap-3" />

	<Button
		class="mt-auto w-full text-lg font-bold"
		size="extraLg">Track Progress</Button
	>
</Page>
