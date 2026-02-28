<script lang="ts">
	import { MonthPage, PlanPage } from '$lib/modules/month';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.monthStatus.isMonthComplete}
	<PlanPage monthStatus={data.monthStatus} />
{:else}
	<MonthPage monthStatus={data.monthStatus} />
{/if}
