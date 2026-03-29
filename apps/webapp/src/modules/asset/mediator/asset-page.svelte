<script lang="ts">
	import { AddHistory, HistoryChart, HistorySection, HistoryStore } from '$modules/history';
	import { ROUTER } from '$shared/config/router';
	import { formatMoney } from '$shared/lib/money';
	import { ChevronLeft, Plus } from '@lucide/svelte';
	import { Button, Header, TrendBadge } from '@monesto/ui-kit';

	let {
		title,
		price,
		count,
		unit,
		percent
	}: {
		title: string;
		unit: string;
		count: number;
		price: number;
		percent: number;
	} = $props();

	const historyStore = new HistoryStore();
</script>

<Header>
	{#snippet left()}
		<a href={ROUTER.home} class="w-fit">
			<Button tabindex="-1" variant="ghost" size="icon">
				<ChevronLeft size={20} />
			</Button>
		</a>
	{/snippet}
	<h1 class="text-center text-[#0F172A] font-bold">{title}</h1>
	{#snippet right()}
		<AddHistory
			class="ml-auto"
			onAddHistory={(data, onClose) => {
				historyStore.histories.push({
					id: crypto.randomUUID(),
					date: new Date(),
					unit: '',
					count: +data.count,
					price: +data.price,
					type: data.type
				});
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
		<p class="text-[#0F172A] font-bold text-4xl">{formatMoney(price)}</p>
		<TrendBadge size="sm" {percent} />
	</div>
	<div class="flex items-end justify-center gap-2 text-[#94A3B8] text-[13px]">
		<span>Всего: {count} {unit}</span>
		<span>•</span>
		<span>Средняя: {formatMoney(price / count)}/{unit}</span>
	</div>
</section>

<HistoryChart />

<HistorySection histories={historyStore.histories} />
