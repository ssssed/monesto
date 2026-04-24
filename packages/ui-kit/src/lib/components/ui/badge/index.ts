import { tv } from "tailwind-variants";

export { default as Badge } from "./badge.svelte"
export { default as TrendBadge } from "./trend-badge.svelte"

export const badgeVariants = tv({
	base: "inline-flex items-center justify-center rounded-full whitespace-nowrap",
	variants: {
		color: {
			green: "bg-[#DCFCE7] text-[#16A34A] font-semibold",
			red: "bg-[#FEE2E2] text-[#DC2626] font-semibold",
			blue: "bg-[#DC2626] text-[#3B82F6] font-medium",
			"light-green": "bg-[#F0FDF4] text-[#16A34A] font-medium",
			orange: "bg-[#FEFCE8] text-[#D97706] font-medium",
			gray: "bg-[#F1F5F9] text-[#475569] font-medium"
		},
		size: {
			sm: "text-xs px-2 py-0.5 h-5",
			default: "text-[13px] px-1 py-2.5 h-6"
		}
	},
	defaultVariants: {
		color: "gray",
		size: "default"
	}
});

export type BadgeColor = "green" | "red" | "blue" | "light-green" | "orange" | "gray";
export type BadgeSize = "sm" | "default";
