<script lang="ts">
	import { PlusIcon, Wallet } from '@lucide/svelte';
	import { Button, Empty } from '@monesto/ui-kit';
	import { getContext } from 'svelte';
	import AddAsset from '../mediator/add-asset.svelte';
	import { ASSET_STORE_CONTEXT, AssetsStore, type AssetType } from '../model/model.svelte';
	import Asset from './asset.svelte';

	let { assets = $bindable([]) } = $props<{ assets: AssetType[] }>();
	let assetsStore: AssetsStore = getContext(ASSET_STORE_CONTEXT);
</script>

{#if assets.length > 0}
	<div class="grid grid-cols-1 gap-3">
		{#each assets as asset (asset.id)}
			<Asset {asset} />
		{/each}
	</div>
{:else}
	<Empty
		title="Нет активов"
		description="Добавьте свой первый актив - валюту, золото, копилку или инвест"
	>
		{#snippet icon()}
			<div
				class="h-14 w-14 mb-2.5 flex items-center rounded-full justify-center bg-[linear-gradient(135deg,_#f0fdf4_0%,_#dcfce7_100%)]"
			>
				<Wallet size={24} color="#22c55e" />
			</div>
		{/snippet}
		<AddAsset
			onSubmit={async (asset, onClose) => {
				await assetsStore.createAsset(asset);
				onClose();
			}}
		>
			<Button variant="secondary" class="mt-3 w-full">
				<PlusIcon size={20} color="#15803d" />
				Добавить актив
			</Button>
		</AddAsset>
	</Empty>
{/if}
