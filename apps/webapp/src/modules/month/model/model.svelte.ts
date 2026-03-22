import { ArrowLeft, X, type IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';
import MonthIncomePage from '../mediators/incoming-page.svelte';

export type StepProps = {
	onNext: () => void;
	onPrev: () => void;
	hasNext: boolean;
	hasPrev: boolean;
};

type StepHeader = {
	title?: string;
	leftIcon?: Component<IconProps>;
};

export type StepName = 'incoming' | 'mandatory';

export type Step = {
	step: number;
	component: Component<StepProps>;
	prev: StepName | null;
	next: StepName | null;
	onPrev?: () => void;
	onNext?: () => void;
	header?: StepHeader;
};

export const STEPS: Record<StepName, Step> = {
	incoming: {
		step: 1,
		component: MonthIncomePage,
		next: 'mandatory',
		prev: null,
		onNext: () => {
			console.log(stepStore.incoming);
		},
		onPrev: () => {
			console.log(stepStore.incoming);
		},
		header: {
			title: 'New month',
			leftIcon: ArrowLeft
		}
	},
	mandatory: {
		step: 2,
		component: MonthIncomePage,
		next: null,
		prev: 'incoming',
		onNext: () => {},
		onPrev: () => {},
		header: {
			leftIcon: X
		}
	}
};

export function getStepName(step: number) {
	return Object.keys(STEPS)[step - 1] as StepName;
}

export function defineMonthStateMachine() {
	let step = $state<StepName>('incoming');
	const currentStep = $derived(STEPS[step]);

	const handleNext = () => {
		if (!currentStep.next) return;

		currentStep.onNext?.();
		step = currentStep.next;
	};

	const handlePrev = () => {
		if (!currentStep.prev) return;

		currentStep.onPrev?.();
		step = currentStep.prev;
	};

	const maxSteps = Object.keys(STEPS).length;

	return {
		step,
		currentStep: {
			...currentStep,
			hasNext: currentStep.next != null,
			hasPrev: currentStep.prev != null
		},
		handleNext,
		handlePrev,
		maxSteps
	};
}

export type IncomingStore = {
	type: 'incoming';
	value: string;
};

export type MandatoryStore = {
	type: 'mandatory';
	value: string;
};

type StepStore = IncomingStore | MandatoryStore;

type StepDataMap = {
	incoming: IncomingStore;
	mandatory: MandatoryStore;
};

export let stepStore = $state<{ [K in StepName]: StepDataMap[K] }>({
	incoming: {
		type: 'incoming',
		value: ''
	},
	mandatory: {
		type: 'mandatory',
		value: ''
	}
});
