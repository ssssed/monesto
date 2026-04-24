<script lang="ts">
	import { getAssets } from '$modules/asset';
	import AssetsPage from '$modules/asset/mediator/assets-page.svelte';
	import Loader from '$shared/ui/loader.svelte';
</script>

{#await getAssets()}
	<Loader class="my-auto" overlay title="Monesto" message="Загружаем ваши активы..."></Loader>
{:then assets}
	<AssetsPage initialAssets={assets} />
{/await}
