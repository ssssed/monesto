<script lang="ts">
	import { Plus, Settings2 } from '@lucide/svelte';
	import { Button, Empty } from '@monesto/ui-kit';

	let { class: className } = $props<{
		class?: string;
	}>();
</script>

<section class={className}>
	<div class="flex items-center justify-between">
		<h2 class="text-[#0f172a] text-lg font-bold">Авто-распределение</h2>
		<Button size="icon-sm">
			<Plus size={16} color="#fff" />
		</Button>
	</div>
	<p class="my-3 text-[#94a3b8] text-[13px]">Правила автоматической покупки активов</p>
	<Empty
		class="flex flex-col items-center justify-center"
		title="Нет правил"
		description="Настройте авто-покупку активов при получении дохода"
	>
		{#snippet icon()}
			<div
				class="h-14 w-14 mb-2.5 flex items-center rounded-full justify-center bg-[linear-gradient(135deg,_#f0fdf4_0%,_#dcfce7_100%)]"
			>
				<Settings2 size={24} color="#22c55e" />
			</div>
		{/snippet}
		<Button class="text-white font-semibold mt-2">
			<Plus size={16} color="#fff" />
			Создать правило
		</Button>
	</Empty>
</section>
