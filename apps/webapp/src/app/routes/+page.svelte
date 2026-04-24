<script lang="ts">
	import { AssetsPage, getAssets } from '$modules/asset';
</script>

{#await getAssets()}
	loading...
{:then assets}
	<AssetsPage initialAssets={assets} />
{/await}
