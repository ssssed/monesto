<script lang="ts">
    import { cn } from '$lib/utils';
    import type { Snippet } from 'svelte';


let {icon, title, description, children, class: className} = $props<{
	icon?: Snippet
	title: string;
	description?: string;
	children?: Snippet
	class?: string
}>()
</script>

<div
  class={cn(
    "bg-[#f8fafc] border border-solid border-[#e2e8f0] rounded-[12px] py-6 px-4",
    className,
  )}
>
  {@render icon?.()}
  <h3 class="text-[#334155] font-semibold text-[14px]">{title}</h3>
  {#if description}
    <p
      class="text-[#94a3b8] text-[12px] mt-1 max-w-[180px] text-center leading-[150%]"
    >
      {description}
    </p>
  {/if}
  {@render children?.()}
</div>
