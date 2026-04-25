<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import { Button } from '@monesto/ui-kit';
	import { resetUserData } from '../api';

	let loading = $state<boolean>(false);

	async function handleClearUserData() {
		try {
			loading = true;
			await resetUserData();
		} catch {
			console.error('reset error');
		} finally {
			loading = false;
		}
	}
</script>

<section class="flex flex-col gap-1.5 mt-5">
	<p class="text-[#dc2626] text-[14px] font-semibold">Опасная зона</p>
	<Button variant="danger" size="lg" onclick={handleClearUserData} disabled={loading}>
		<Trash2 />
		Очистить все данные
	</Button>
	<p class="text-[#94A3B8] text-[12px]">Все активы, правила и история будут удалены</p>
</section>
