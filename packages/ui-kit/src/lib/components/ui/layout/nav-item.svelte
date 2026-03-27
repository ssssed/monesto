<script lang="ts">
  import { cn } from '$lib/utils';
  import { Component, type IconProps } from '@lucide/svelte';

	let { icon, label, href, isActive = $bindable(false) } = $props<{
		icon: IconProps['name'];
		label: Component;
		href: string;
		isActive: boolean
	}>();

	const Icon = icon;
</script>

<div
  class={cn(
    "flex flex-col rounded-[36px] items-center justify-center h-[54px] text-[#94a3b8]",
    {
      ["bg-[#0f172a] text-[10px] text-white"]: isActive,
    },
  )}
>
  <Icon size={18} color={isActive ? "white" : "#94a3b8"} />
  <a {href} class="text-sm">{label}</a>
</div>
