<script lang="ts">
	import { RECENT_INFO_CONFIG, type RecentInfoType } from '../constants';

	let {
		type,
		price,
		currency = '$'
	} = $props<{
		type: RecentInfoType;
		price: number;
		currency?: string;
	}>();

	const info = RECENT_INFO_CONFIG[type as RecentInfoType];
</script>

<button
	class="group bg-surface-light dark:bg-surface-dark flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl pr-5 pl-4 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-primary/5 hover:ring-primary dark:ring-white/10 dark:hover:bg-white/5"
>
	<span class="text-lg text-slate-400 group-hover:text-primary dark:text-slate-500">
		<svelte:component this={info.icon} />
	</span>
	<p class="text-sm leading-normal font-medium text-slate-700 dark:text-slate-200">
		{info.text(price, currency)}
	</p>
</button>
