<script lang="ts">
	import { AddHistory, HistoryChart, HistorySection, HistoryStore } from '$modules/history';
	import { ROUTER } from '$shared/config/router';
	import { formatMoney } from '$shared/lib/money';
	import { ChevronLeft, Plus } from '@lucide/svelte';
	import { Button, Header, TrendBadge } from '@monesto/ui-kit';
	import type { AssetType } from '../model/model.svelte';

	let {
		asset
	}: {
		asset: AssetType;
	} = $props();

	const historyStore = new HistoryStore(asset);
</script>

<Header>
	{#snippet left()}
		<a href={ROUTER.home} class="w-fit">
			<Button tabindex="-1" variant="ghost" size="icon">
				<ChevronLeft size={20} />
			</Button>
		</a>
	{/snippet}
	<h1 class="text-center text-[#0F172A] font-bold">{asset.name}</h1>
	{#snippet right()}
		<AddHistory
			mode={asset.type}
			class="ml-auto"
			onAddHistory={(data, onClose) => {
				historyStore.addHistory(data);
				onClose();
			}}
		>
			<Button tabindex="-1" variant="green" size="icon">
				<Plus size={20} color="#16A34A" />
			</Button>
		</AddHistory>
	{/snippet}
</Header>

<section class="mt-[40px] mb-5 flex flex-col gap-1 justify-center">
	<div class="flex items-end gap-2 justify-center">
		<p class="text-[#0F172A] font-bold text-4xl">{formatMoney(asset.price)}</p>
		{#if asset.type === 'priced'}
			<TrendBadge size="sm" percent={asset.priceChange} />
		{/if}
	</div>
	{#if asset.type === 'priced'}
		<div class="flex items-end justify-center gap-2 text-[#94A3B8] text-[13px]">
			<span>Всего: {formatMoney(asset.count, asset.symbol, { symbolPosition: 'right' })}</span>
			<span>•</span>
			<span
				>Средняя: {formatMoney(asset.price / asset.count, asset.symbol, {
					symbolPosition: 'right'
				})}</span
			>
		</div>
	{/if}
</section>

<HistoryChart />

<HistorySection histories={historyStore.histories} />
