<script lang="ts">
	import { accessibleIcons, type AccessibleIconType } from '$shared/config/icons';
	import { ROUTER } from '$shared/config/router';
	import { formatMoney } from '$shared/lib/money';
	import { TrendBadge } from '@monesto/ui-kit';
	import type { Component } from 'svelte';
	import { isLocalCurrency } from '../model/domain';
	import type { AssetType } from '../model/model.svelte';

	let { asset = $bindable<AssetType>() } = $props();

	const Icon = accessibleIcons?.[asset.icon.name as AccessibleIconType] as Component;
</script>

<a
	class="p-4 bg-white rounded-lg border border-solid border-[#F1F5F9] flex justify-between items-center"
	href={ROUTER.asset(asset.slug)}
>
	<div class="flex items-center gap-2.5">
		<div class="p-[9px] rounded-[10px]" style={`background-color: ${asset.icon.backgroundColor}`}>
			<Icon size={18} color={asset.icon.color} />
		</div>
		<h3 class="text-[16px] text-[#0F172A] font-bold">{asset.name}</h3>
	</div>
	<div class="flex items-center gap-2">
		<span class="text-[#0F172A] text-lg font-bold">{formatMoney(asset.price)}</span>
		{#if !isLocalCurrency(asset.currency)}
			<TrendBadge percent={asset.profit.percent.toFixed(2)} />
		{/if}
	</div>
</a>
