<script lang="ts">
	import { PUBLIC_BOT_NAME, PUBLIC_BOT_URL } from '$env/static/public';
	import { Send } from '@lucide/svelte';
</script>

<section class="text-center mt-auto py-3">
	<span class="text-[#cbd5e1] text-[12px] font-medium">Monesto v{__APP_VERSION__}</span>
	<div class="flex gap-1 items-center justify-center">
		<Send size={13} color="#94a3b8" />
		<a class="text-[12px] font-medium text-[#94a3b8]" href={PUBLIC_BOT_URL}>{PUBLIC_BOT_NAME}</a>
	</div>
</section>
