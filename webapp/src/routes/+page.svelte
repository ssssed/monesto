<script lang="ts">
	import { MonthPage, getMonthStatus } from '$lib/modules/month';
</script>

{#await getMonthStatus()}
	Loading...
{:then monthStatus}
	{#if monthStatus.isMonthComplete}
		Complete...
	{:else}
		<MonthPage />	
	{/if}
{/await}
