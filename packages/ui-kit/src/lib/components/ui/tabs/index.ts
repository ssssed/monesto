import Content from "./tabs-content.svelte"
import List from "./tabs-list.svelte"
import Trigger from "./tabs-trigger.svelte"
import Root from "./tabs.svelte"
import { tv } from "tailwind-variants"

export const tabsListVariants = tv({
	base: "rounded-lg p-[3px] group-data-horizontal/tabs:h-11 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
	variants: {
		variant: {
			default: "cn-tabs-list-variant-default bg-muted",
			line: "cn-tabs-list-variant-line gap-1 bg-transparent",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export type TabsListVariant = "default" | "line"

export {
	Root as Tabs,
	Content as TabsContent,
	List as TabsList, Trigger as TabsTrigger
}

