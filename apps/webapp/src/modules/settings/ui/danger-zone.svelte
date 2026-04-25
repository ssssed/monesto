<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import { Button } from '@monesto/ui-kit';
</script>

<section class="flex flex-col gap-1.5 mt-5">
	<p class="text-[#dc2626] text-[14px] font-semibold">Опасная зона</p>
	<Button variant="danger" size="lg">
		<Trash2 />
		Очистить все данные
	</Button>
	<p class="text-[#94A3B8] text-[12px]">Все активы, правила и история будут удалены</p>
</section>
