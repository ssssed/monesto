import { ArrowRight, type IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';

import ControlStep from './ui/control-step.svelte';
import FutureStep from './ui/future-step.svelte';
import HookStep from './ui/hook-step.svelte';
import ProblemStep from './ui/problem-step.svelte';
import SolutionStep from './ui/solution-step.svelte';
import StartStep from './ui/start-step.svelte';

export type OnboardingStep = {
	id: string;
	component: Component;
	buttonText: string;
	isFinal?: boolean;
	buttonIcon?: Component<IconProps>;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
	{
		id: 'hook',
		component: HookStep,
		buttonText: 'Далее'
	},
	{
		id: 'problem',
		component: ProblemStep,
		buttonText: 'Далее'
	},
	{
		id: 'solution',
		component: SolutionStep,
		buttonText: 'Далее'
	},
	{
		id: 'future',
		component: FutureStep,
		buttonText: 'Далее'
	},
	{
		id: 'control',
		component: ControlStep,
		buttonText: 'Далее'
	},
	{
		id: 'start',
		component: StartStep,
		buttonText: 'Начать',
		buttonIcon: ArrowRight,
		isFinal: true
	}
];
