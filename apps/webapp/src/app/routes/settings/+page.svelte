<script lang="ts">
	import { getAllocationRules, SettingsPage } from '$modules/settings';
	import Loader from '$shared/ui/loader.svelte';
</script>

{#await Promise.all([getAllocationRules()])}
	<Loader class="my-auto" overlay title="Monesto" message="Загружаем ваш актив..." />
{:then [rules]}
	<SettingsPage {rules} />
{/await}
