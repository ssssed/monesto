<script lang="ts">
	import { PlusIcon, TrendingUp } from '@lucide/svelte';
	import { Button } from '@monesto/ui-kit';
	import { AssetsStore } from '../model/model.svelte';
	import AssetsList from '../ui/assets-list.svelte';
	import TotalAssets from '../ui/total-assets.svelte';
	import AddAsset from './add-asset.svelte';

	let assetsStore = new AssetsStore();
	let total = $derived(assetsStore.assets.reduce((acc, asset) => (acc += asset.price), 0));
</script>

<div class="flex flex-col gap-3 items-center justify-center max-w-[280px] mx-auto text-center mb-6">
	<div class="p-3.5 rounded-full bg-[#F1F5F9] stroke-1 stroke-[#F1F5F9]">
		<TrendingUp size={28} color="#3B82F6" />
	</div>
	<h1 class="text-[#0F172A] text-3xl font-bold">Ваши активы</h1>
	<p class="text-[#64748B] text-[15px]">Отслеживайте свои активы и их доходность</p>
</div>

<TotalAssets {total} prefix="₽" />

<AssetsList bind:assets={assetsStore.assets} />

<AddAsset
	onSubmit={(asset, onClose) => {
		switch (asset.type) {
			case 'base': {
				assetsStore.addAsset({
					icon: asset.icon,
					name: asset.name,
					id: crypto.randomUUID(),
					symbol: '₽',
					type: 'base',
					price: 0
				});
				break;
			}
			case 'priced': {
				assetsStore.addAsset({
					icon: asset.icon,
					name: asset.name,
					id: crypto.randomUUID(),
					symbol: '₽',
					type: 'priced',
					priceChange: 1,
					price: 0
				});
				break;
			}
		}

		onClose();
	}}
>
	<Button class="mt-3 w-full text-[#64748B]" variant="outline" size="extraLg">
		<PlusIcon size={20} color="#64748B" />
		Добавить актив
	</Button>
</AddAsset>
