<script lang="ts">
	import { formatMoney } from '$shared/lib/money';
	import { Info, WalletIcon } from '@lucide/svelte';

	let {
		total = $bindable(0),
		prefix = $bindable('₽'),
		isEmpty
	} = $props<{
		total: number;
		prefix?: string;
		isEmpty?: boolean;
	}>();
</script>

{#if !isEmpty}
	<div
		class="mb-6 border border-solid border-[#E2E8F0] bg-[linear-gradient(135deg,_#eff6ff_0%,_#eef2ff_100%)] px-5 py-4 flex flex-col gap-1 rounded-2xl"
	>
		<h3 class="inline-flex h-4.5 items-center gap-2 text-[#1D4ED8] font-semibold text-[11px]">
			<span>
				<WalletIcon size={18} color="#2563EB" />
			</span>
			<span class="uppercase">Итого</span>
		</h3>
		<p class="text-[#1E3A8A] text-[32px] font-bold">{formatMoney(total, prefix)}</p>
	</div>
{:else}
	<div
		class="mb-6 border border-solid border-[#E2E8F0] bg-[linear-gradient(135deg,_#eff6ff_0%,_#eef2ff_100%)] px-5 py-4 flex flex-col gap-1 rounded-2xl"
	>
		<h3 class="inline-flex h-4.5 items-center gap-2 text-[#1D4ED8] font-semibold text-[11px]">
			<span>
				<WalletIcon size={18} color="#2563EB" />
			</span>
			<span class="uppercase">Итого</span>
		</h3>
		<p class="text-[#93c5fd] text-[32px] font-bold">{prefix} ———</p>
		<span class="text-[#93c5fd] text-[11px] flex gap-1 items-center">
			<Info size={12} color="#93c5fd" />
			Добавьте активы, чтобы увидеть сумму
		</span>
	</div>
{/if}
