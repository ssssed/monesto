<script lang="ts">
	import { TrendingUp } from '@lucide/svelte';
	import { Button } from '@monesto/ui-kit';
	import { __ASSETS_MOCK__ } from '../model/__mocks__';
	import AssetsList from '../ui/assets-list.svelte';
	import TotalAssets from '../ui/total-assets.svelte';
</script>

<div class="flex flex-col gap-3 items-center justify-center max-w-[280px] mx-auto text-center mb-6">
	<div class="p-3.5 rounded-full bg-[#F1F5F9] stroke-1 stroke-[#F1F5F9]">
		<TrendingUp size={28} color="#3B82F6" />
	</div>
	<h1 class="text-[#0F172A] text-3xl font-bold">Ваши активы</h1>
	<p class="text-[#64748B] text-[15px]">Отслеживайте свои активы и их доходность</p>
</div>

<TotalAssets total={672400} prefix="₽" />

<AssetsList assets={__ASSETS_MOCK__} />

<Button class="mt-3" variant="outline" size="extraLg">Добавить актив</Button>
