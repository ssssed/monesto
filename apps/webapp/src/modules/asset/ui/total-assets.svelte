<script lang="ts">
	import { formatMoney } from '$shared/lib/money';
	import { WalletIcon } from '@lucide/svelte';

	let { total = $bindable(0), prefix = $bindable('₽') } = $props<{
		total: number;
		prefix?: string;
	}>();
</script>

<div class="mb-6 stroke-1 stroke-[#E2E8F0] bg-[#EEF2FF] px-5 py-4 flex flex-col gap-1 rounded-2xl">
	<h3 class="inline-flex h-4.5 items-center gap-2 text-[#1D4ED8] font-semibold text-[11px]">
		<span>
			<WalletIcon size={18} color="#2563EB" />
		</span>
		<span class="uppercase">Итого</span>
	</h3>
	<p class="text-[#1E3A8A] text-[32px] font-bold">{formatMoney(total, prefix)}</p>
</div>
