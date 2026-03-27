<script lang="ts">
	import { accessibleIcons, type AccessibleIconType } from '$shared/config/icons';
	import { formatMoney } from '$shared/lib/money';
	import { TrendBadge } from '@monesto/ui-kit';
	import type { Component } from 'svelte';
	import type { AssetType } from '../model/model.svelte';

	let { asset = $bindable<AssetType>() } = $props<{ asset: AssetType }>();

	const Icon = accessibleIcons?.[asset.icon.name as AccessibleIconType] as Component;
</script>

<div class="p-4 bg-white rounded-lg stroke-1 stroke-[#F1F5F9] flex justify-between items-center">
	<div class="flex items-center gap-2.5">
		<div class="p-[9px] rounded-[10px]" style={`background-color: ${asset.icon.backgroundColor}`}>
			<Icon size={18} color={asset.icon.color} />
		</div>
		<h3 class="text-[16px] text-[#0F172A] font-bold">{asset.name}</h3>
	</div>
	<div class="flex items-center gap-2">
		<span class="text-[#0F172A] text-lg font-bold">{formatMoney(asset.price, asset.symbol)}</span>
		{#if asset.type === 'priced'}
			<TrendBadge percent={asset.priceChange} />
			<!-- <span class="text-[#0F172A] text-lg font-bold">{asset.priceChange}</span> -->
		{/if}
	</div>
</div>
