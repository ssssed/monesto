<script lang="ts">
	import DangerZone from '../ui/danger-zone.svelte';
	import IncomeSection from '../ui/income-section.svelte';
	import InfoSection from '../ui/info-section.svelte';
	import RulesSection from '../ui/rules-section.svelte';
</script>

<h1 class="text-[#0f172a] font-bold text-2xl h-12 flex items-center">Настройки</h1>

<RulesSection class="mb-5" />
<IncomeSection class="mb-5" />

<hr class="mt-5" />

<DangerZone />
<InfoSection />
