<script lang="ts">
	import AssetPage from '$modules/asset/mediator/asset-page.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<AssetPage asset={data.asset} initialHistories={data.histories} />
