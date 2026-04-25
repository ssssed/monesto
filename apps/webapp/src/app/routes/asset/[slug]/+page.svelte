<script lang="ts">
	import { getAssetBySlug } from '$modules/asset';
	import AssetPage from '$modules/asset/mediator/asset-page.svelte';
	import { getTransactionHistories } from '$modules/history';
	import Loader from '$shared/ui/loader.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
</script>

{#await Promise.all([getAssetBySlug(params.slug), getTransactionHistories(params.slug)])}
	<Loader class="my-auto" overlay title="Monesto" message="Загружаем ваш актив..." />
{:then [asset, transactions]}
	<AssetPage
		{asset}
		initialHistories={transactions.histories}
		initialChartData={transactions.chart}
	/>
{/await}
