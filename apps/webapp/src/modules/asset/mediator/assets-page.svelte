<script lang="ts">
	import { PlusIcon, TrendingUp } from '@lucide/svelte';
	import { Button } from '@monesto/ui-kit';
	import { setContext } from 'svelte';
	import { ASSET_STORE_CONTEXT, AssetsStore, type AssetType } from '../model/model.svelte';
	import AssetsList from '../ui/assets-list.svelte';
	import TotalAssets from '../ui/total-assets.svelte';
	import AddAsset from './add-asset.svelte';

	let { initialAssets } = $props<{
		initialAssets: AssetType[];
	}>();

	let assetsStore = new AssetsStore(initialAssets);
	let total = $derived(assetsStore.assets.reduce((acc, asset) => (acc += asset.price), 0));

	setContext(ASSET_STORE_CONTEXT, assetsStore);
</script>

<div class="flex flex-col gap-3 items-center justify-center max-w-[280px] mx-auto text-center mb-6">
	<div class="p-3.5 rounded-full bg-[#F1F5F9] border border-solid border-[#F1F5F9]">
		<TrendingUp size={28} color="#3B82F6" />
	</div>
	<h1 class="text-[#0F172A] text-3xl font-bold">Ваши активы</h1>
	<p class="text-[#64748B] text-[15px]">Отслеживайте свои активы и их доходность</p>
</div>

<TotalAssets {total} prefix="₽" isEmpty={assetsStore.assets.length === 0} />

<AssetsList bind:assets={assetsStore.assets} />

{#if assetsStore.assets.length > 0}
	<AddAsset
		onSubmit={async (asset, onClose) => {
			await assetsStore.createAsset(asset);
			onClose();
		}}
	>
		<Button class="mt-3 w-full text-[#64748B]" variant="outline" size="extraLg">
			<PlusIcon size={20} color="#64748B" />
			Добавить актив
		</Button>
	</AddAsset>
{/if}
