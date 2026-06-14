<script lang="ts">
	import { AssetsStore, type AssetType } from '$modules/asset';
	import { AllocateRulesStore, type RuleType } from '../model/model.svelte';
	import DangerZone from '../ui/danger-zone.svelte';
	import IncomeSection from '../ui/income-section.svelte';
	import InfoSection from '../ui/info-section.svelte';
	import RulesSection from '../ui/rules-section.svelte';

	let { rules, assets, userSettings } = $props<{
		rules: RuleType[];
		assets: AssetType[];
	}>();

	new AssetsStore(assets).saveToContext();
	new AllocateRulesStore(rules).saveToContext();
</script>

<h1 class="text-[#0f172a] font-bold text-2xl h-12 flex items-center">Настройки</h1>

<RulesSection class="mb-5" />
<IncomeSection class="mb-5" />

<hr class="mt-5" />

<DangerZone />
<InfoSection />
