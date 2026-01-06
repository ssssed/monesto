import { ArrowLeft, History, TrendingUp, X, type IconProps } from '@lucide/svelte';
import MonthIncomePage from './mediators/month-income-page.svelte';
import MonthMandatoryPage from './mediators/month-mandatory-page.svelte';
import type { Component } from 'svelte';
import type { StepProps } from './types';

export const RECENT_INFO_CONFIG = {
	average: {
		icon: TrendingUp,
		text: (price: number, currency = '$') => `Last Month: ${currency}${price}`
	},
	last: {
		icon: History,
		text: (price: number, currency = '$') => `Average: ${currency}${price}`
	}
};

export type RecentInfoType = keyof typeof RECENT_INFO_CONFIG;

export type NewMonthStepType = 'incoming' | 'mandatory' | 'strategy';

export const STEPS: Record<
	NewMonthStepType,
	{
		step: number;
		headerActionButton: {
			type: 'close' | 'back';
			icon: Component<IconProps>;
		};
		component: Component<StepProps> | null;
		next: NewMonthStepType | null;
		prev: NewMonthStepType | null;
	}
> = {
	incoming: {
		step: 1,
		headerActionButton: {
			type: 'close',
			icon: X
		},
		component: MonthIncomePage,
		next: 'mandatory',
		prev: null
	},
	mandatory: {
		step: 2,
		headerActionButton: {
			type: 'back',
			icon: ArrowLeft
		},
		component: MonthMandatoryPage,
		next: 'strategy',
		prev: 'incoming'
	},
	strategy: {
		step: 3,
		headerActionButton: {
			type: 'back',
			icon: ArrowLeft
		},
		component: null,
		next: null,
		prev: 'mandatory'
	}
};

export const SUGGESTS = ['🏠 Rent', '⚡ Utilities', '🛡️ Insurance'];
