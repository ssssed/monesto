import { History, Shield, TrendingUp } from '@lucide/svelte';

export const RECENT_INFO_CONFIG = {
	average: {
		icon: TrendingUp,
		text: (price: number, currency = '$') => `Average: ${currency}${price}`
	},
	last: {
		icon: History,
		text: (price: number, currency = '$') => `Last Month: ${currency}${price}`
	}
};

export type RecentInfoType = keyof typeof RECENT_INFO_CONFIG;

export const SUGGESTS = ['🏠 Rent', '⚡ Utilities', '🛡️ Insurance'];

export const STRATEGIES = [
	{
		name: 'stash',
		icon: Shield,
		title: 'Emergency Fund',
		description: 'Save 3-6 months of expenses for safety.'
	}
];
