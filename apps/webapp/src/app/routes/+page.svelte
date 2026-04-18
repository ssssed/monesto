<script lang="ts">
	import { AssetsPage } from '$modules/asset';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	console.log('data', data);
</script>

<AssetsPage initialAssets={data.assets} />
