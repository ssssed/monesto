<script lang="ts">
	import { ROUTER } from '$shared/config/router';
	import { ChevronLeft, Plus } from '@lucide/svelte';
	import { Button, Header, TrendBadge } from '@monesto/ui-kit';
	import { HistoryStore } from '../model/model.svelte';
	import HistoryChart from '../ui/history-chart.svelte';
	import HistorySection from '../ui/history-section.svelte';

	let {
		title
	}: {
		title: string;
	} = $props();

	const historyStore = new HistoryStore();
</script>

<Header>
	{#snippet left()}
		<a href={ROUTER.home}>
			<Button variant="ghost" size="icon">
				<ChevronLeft size={20} />
			</Button>
		</a>
	{/snippet}
	<h1 class="text-center text-[#0F172A] font-bold">{title}</h1>
	{#snippet right()}
		<Button class="ml-auto" variant="ghost" size="icon">
			<Plus size={20} />
		</Button>
	{/snippet}
</Header>

<section class="mt-[40px] mb-5 flex flex-col gap-1 justify-center">
	<div class="flex items-end gap-2 justify-center">
		<p class="text-[#0F172A] font-bold text-4xl">₽185,000</p>
		<TrendBadge size="sm" percent={15.2} />
	</div>
	<div class="flex items-end justify-center gap-2 text-[#94A3B8] text-[13px]">
		<span>Всего: 30 гр</span>
		<span>•</span>
		<span>Средняя: ₽5,350/гр</span>
	</div>
</section>

<HistoryChart />

<HistorySection histories={historyStore.histories} />
