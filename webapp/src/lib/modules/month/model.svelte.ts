import type { Component } from 'svelte';
import { ArrowLeft, X, type IconProps } from '@lucide/svelte';
import type { StepProps } from './types';
import MonthIncomePage from './mediators/month-income-page.svelte';
import MonthMandatoryPage from './mediators/month-mandatory-page.svelte';
import MonthStrategyPage from './mediators/month-strategy-page.svelte';
import FinishPage from './mediators/finish-page.svelte';
import { updateMonthData, type UpdateMonthBodyType } from './api';

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

const updateMonthField = async <T extends keyof UpdateMonthBodyType>(
	field: T,
	value: UpdateMonthBodyType[T]
) => {
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();

	await updateMonthData({
		month,
		year,
		[field]: value
	});
};

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
		onPrev?: () => void;
		onNext?: () => void;
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
		prev: null,
		onNext: () => {
			updateMonthField('incoming', monthStore.incoming.value);
		}
	},
	mandatory: {
		step: 2,
		headerActionButton: {
			type: 'back',
			icon: ArrowLeft
		},
		component: MonthMandatoryPage,
		next: 'strategy',
		prev: 'incoming',
		onNext: () => {
			updateMonthField('mandatory', monthStore.mandatory.value);
		}
	},
	strategy: {
		step: 3,
		headerActionButton: {
			type: 'back',
			icon: ArrowLeft
		},
		component: MonthStrategyPage,
		next: 'finish',
		prev: 'mandatory',
		onNext: () => {
			updateMonthField('strategy', monthStore.strategy.selectedId);
		}
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
