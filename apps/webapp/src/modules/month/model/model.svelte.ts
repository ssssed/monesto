import { X, type IconProps } from '@lucide/svelte';
import { type Component } from 'svelte';
import MonthIncomePage from '../mediators/incoming-page.svelte';
import type { StepProps } from './types';

type Base = {
	type: NewMonthStepType;
};

type IncomingStore = Base & {
	type: 'incoming';
	value: string;
};

type StepStoreMap = {
	incoming: IncomingStore;
};

export let monthStore = $state<StepStoreMap>({
	incoming: {
		type: 'incoming',
		value: ''
	}
});

export type NewMonthStepType = 'incoming';

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
		next: null,
		prev: null
	}
};
