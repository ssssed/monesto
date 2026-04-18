<script lang="ts" module>
	const text: Record<HistoryType['type'], string> = {
		buy: 'Покупка',
		sell: 'Продажа'
	};

	const icons: Record<HistoryType['type'], Component> = {
		buy: ArrowDownLeft,
		sell: ArrowUpRight
	};
</script>

<script lang="ts">
	import { formatMoney } from '$shared/lib/money';
	import { formatDate } from '$shared/lib/time';
	import { ArrowDownLeft, ArrowUpRight } from '@lucide/svelte';
	import { cn } from '@monesto/ui-kit';
	import type { Component } from 'svelte';
	import type { HistoryType } from '../model/model.svelte';

	let { histories = $bindable([]) }: { histories: HistoryType[] } = $props();

	let sortedHistories = $derived(
		histories.toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);
</script>

<section class="flex flex-col gap-2.5">
	<p class="text-[#0F172A] font-semibold text-[16px]">История операций</p>
	<div class="grid grid-cols-1 bg-white rounded-2xl border border-solid border-[#F1F5F9]">
		{#each sortedHistories as history, index (history.id)}
			{@const Icon = icons[history.type]}
			<div class={cn('flex gap-3 items-center px-4 py-3')}>
				<div
					class={cn('p-2 rounded-[8px]', {
						['bg-[#DCFCE7]']: history.type === 'buy',
						['bg-[#FEE2E2]']: history.type === 'sell'
					})}
				>
					<Icon size={16} color={history.type === 'buy' ? '#16A34A' : '#DC2626'} />
				</div>
				<div>
					<h3 class="text-[#0F172A]">{text[history.type]}</h3>
					<p class="text-[#94A3B8] text-[13px]">
						{formatDate(history.date)} • {history.count}
						{history.unit} × {formatMoney(history.price)}
					</p>
				</div>
				<span
					class={cn('font-bold text-[15px] ml-auto', {
						['text-[#16A34A]']: history.type === 'buy',
						['text-[#DC2626]']: history.type === 'sell'
					})}>{formatMoney(history.price * history.count)}</span
				>
			</div>
			{#if index !== histories.length - 1}
				<div class="h-px bg-[#F1F5F9] w-full"></div>
			{/if}
		{/each}
	</div>
</section>
