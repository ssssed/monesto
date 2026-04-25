<script lang="ts" module>
	import { Plus } from '@lucide/svelte';
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
	import { ArrowDownLeft, ArrowUpRight, History } from '@lucide/svelte';
	import { cn, Empty } from '@monesto/ui-kit';
	import Button from '@monesto/ui-kit/components/ui/button/button.svelte';
	import { getContext, type Component } from 'svelte';
	import AddHistory from '../mediator/add-history.svelte';
	import { HISTORY_STORE_CONTEXT, HistoryStore, type HistoryType } from '../model/model.svelte';

	let {
		histories = $bindable([]),
		isLocalCurrency
	}: { histories: HistoryType[]; isLocalCurrency: boolean } = $props();

	let sortedHistories = $derived(
		histories.toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);

	const historyStore: HistoryStore = getContext(HISTORY_STORE_CONTEXT);
</script>

<section class="flex flex-col gap-2.5">
	<p class="text-[#0F172A] font-semibold text-[16px]">История операций</p>
	{#if histories.length > 0}
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
							{`${history.unit} ${!isLocalCurrency ? '× ' + formatMoney(history.price) : ''}`}
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
	{:else}
		<Empty
			class="bg-white"
			title="История пуста"
			description="Нажмите +, чтобы добавить первую операцию по этому активу"
		>
			{#snippet icon()}
				<div class="h-14 w-14 mb-2.5 flex items-center rounded-full justify-center bg-[#f1f5f9]">
					<History size={24} color="#94a3b8" />
				</div>
			{/snippet}
			<AddHistory
				class="mt-2"
				onAddHistory={(data, onClose) => {
					historyStore.addHistory(data);
					onClose();
				}}
				{isLocalCurrency}
			>
				<Button tabindex={-1} variant="secondary" size="sm">
					<Plus size={20} color="#15803d" />
					Добавить событие
				</Button>
			</AddHistory>
		</Empty>
	{/if}
</section>
