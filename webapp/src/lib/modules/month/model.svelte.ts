import type { Component } from 'svelte';
import { ArrowLeft, X, type IconProps } from '@lucide/svelte';
import type { StepProps } from './types';
import MonthIncomePage from './mediators/month-income-page.svelte';
import MonthMandatoryPage from './mediators/month-mandatory-page.svelte';
import MonthStrategyPage from './mediators/month-strategy-page.svelte';
import FinishPage from './mediators/finish-page.svelte';

type Base = {
	type: NewMonthStepType;
};

type IncomingStore = Base & {
	type: 'incoming';
	value: string;
};

type MandatoryStore = Base & {
	type: 'mandatory';
	value: string;
};

type StrategyStore = Base & {
	type: 'strategy';
	selectedId: string;
};

type StepStoreMap = {
	incoming: IncomingStore;
	mandatory: MandatoryStore;
	strategy: StrategyStore;
};

export let monthStore = $state<StepStoreMap>({
	incoming: {
		type: 'incoming',
		value: ''
	},
	mandatory: {
		type: 'mandatory',
		value: ''
	},
	strategy: {
		type: 'strategy',
		selectedId: '1'
	}
});

export type NewMonthStepType = 'incoming' | 'mandatory' | 'strategy' | 'finish';

export const STEPS: Record<
	NewMonthStepType,
	{
		step: number;
		title?: string;
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
		title: 'New Month',
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
		component: MonthStrategyPage,
		next: 'finish',
		prev: 'mandatory'
	},
	finish: {
		step: 4,
		headerActionButton: {
			type: 'back',
			icon: ArrowLeft
		},
		component: FinishPage,
		next: null,
		prev: 'strategy'
	}
};
