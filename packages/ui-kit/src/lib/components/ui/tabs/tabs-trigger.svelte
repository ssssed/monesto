<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Tabs as TabsPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
  bind:ref
  data-slot="tabs-trigger"
  class={cn(
    "py-[9px] bg-[#F1F5F9] text-[#94A3B8] text-[13px] font-medium rounded-[8px] inline-flex flex-1 h-[calc(100%-1px)] items-center justify-center whitespace-nowrap",
    "data-[state=active]:bg-[#0F172A] data-[state=active]:text-white data-[state=active]:font-semibold",
    className,
  )}
  {...restProps}
/>
