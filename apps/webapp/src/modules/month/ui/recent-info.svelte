<script lang="ts">
	import { cn } from '@monesto/ui-kit';
	import { RECENT_INFO_CONFIG, type RecentInfoType } from '../model/constants';

	let {
		type,
		price,
		currency = '$',
		onClick,
		value = $bindable(price),
		disabled
	} = $props<{
		type: RecentInfoType;
		price: string;
		currency?: string;
		onClick?: () => void;
		value?: string;
		disabled?:boolean;
	}>();

	const info = RECENT_INFO_CONFIG[type as RecentInfoType];
</script>

<button
	class={cn(
		'group bg-surface-light dark:bg-surface-dark flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl pr-5 pl-4 ring-1 ring-slate-200 transition-[background-color,color,box-shadow,transform] duration-100 ease-out hover:bg-primary/5 hover:ring-primary dark:ring-white/10 dark:hover:bg-white/5',
		{
			['active:scale-95 active:bg-primary/10']:
			!disabled	
		}
	)}
	onclick={() => {
		if (disabled) return;

		value = price;
		onClick?.();
	}}
>
	<span class="text-lg text-slate-400 group-hover:text-primary dark:text-slate-500">
		<info.icon />
	</span>
	<p class="text-sm leading-normal font-medium text-slate-700 dark:text-slate-200">
		{info.text(price, currency)}
	</p>
</button>