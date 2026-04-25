<script lang="ts">
	import { Banknote, Plus } from '@lucide/svelte';
	import { Button, Empty } from '@monesto/ui-kit';

	let { class: className } = $props<{
		class?: string;
	}>();
</script>

<section class={className}>
	<div class="flex items-center justify-between">
		<h2 class="text-[#0f172a] text-lg font-bold">Доходы</h2>
		<Button size="icon-sm" variant="secondary">
			<Plus size={16} color="#15803d" />
		</Button>
	</div>
	<p class="my-3 text-[#94a3b8] text-[13px]">Источники дохода и график поступлений</p>
	<Empty
		title="Нет источников дохода"
		description="Добавьте доходы для авто-распределения по активам"
	>
		{#snippet icon()}
			<div
				class="h-14 w-14 mb-2.5 flex items-center rounded-full justify-center bg-[linear-gradient(135deg,_#f0fdf4_0%,_#dcfce7_100%)]"
			>
				<Banknote size={24} color="#22c55e" />
			</div>
		{/snippet}
		<Button variant="secondary" class="font-semibold mt-2">
			<Plus size={16} color="#15803d" />
			Добавить доход
		</Button>
	</Empty>
</section>
