<script lang="ts">
	import { getAssets } from '$modules/asset';
	import { getAllocationRules, SettingsPage } from '$modules/settings';
	import Loader from '$shared/ui/loader.svelte';
</script>

{#await Promise.all([getAllocationRules(), getAssets()])}
	<Loader class="my-auto" overlay title="Monesto" message="Загружаем ваш актив..." />
{:then [rules, assets]}
	<SettingsPage {rules} {assets} />
{/await}
