<script lang="ts">
	import { accessibleIcons, type AccessibleIconType } from '$shared/config/icons';
	import { formatMoney } from '$shared/lib/money';
	import { Badge } from '@monesto/ui-kit';
	import type { Component } from 'svelte';
	import { TOP_UP_TYPE_TEXT_MAPPER } from '../model/constants';
	import { type RuleType } from '../model/model.svelte';

	let { asset, executionDate, topUpType, value }: RuleType = $props();

	$inspect(asset);

	const Icon = accessibleIcons?.[asset.icon.name as AccessibleIconType] as Component;

	const day = new Date(executionDate).getDate();
</script>

<div
	class="w-full rounded-[12px] flex flex-col gap-2.5 py-[14px] px-4 bg-white border border-solid border-[#F1F5F9]"
>
	<div class="flex justify-between items-center">
		<div class="flex items-center gap-2">
			<div class="p-[7px] rounded-[8px]" style={`background-color: ${asset.icon.backgroundColor}`}>
				<Icon size={14} color={asset.icon.color} />
			</div>
			<h3 class="text-[15px] text-[#0F172A] font-semibold">{asset.name}</h3>
		</div>
		<Badge color="blue" size="lg">
			{day} число
		</Badge>
	</div>
	<p class="text-[#64748B] font-medium text-[13px]">
		{topUpType !== 'percent' ? formatMoney(value, asset.symbol) : value}{TOP_UP_TYPE_TEXT_MAPPER[
			topUpType
		]}
	</p>
</div>
