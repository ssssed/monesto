<script lang="ts">
	import AssetPage from '$modules/asset/mediator/asset-page.svelte';
	import { __ASSETS_MOCK__ } from '$modules/asset/model/__mocks__';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const asset = $derived(__ASSETS_MOCK__.find((el) => el.slug === params.slug));

	if (!asset) throw new Error();
</script>

<AssetPage {asset} />
