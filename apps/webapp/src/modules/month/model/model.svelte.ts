import { ArrowLeft, type IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';
import MonthIncomePage from '../mediators/incoming-page.svelte';
import MandatoryPage from '../mediators/mandatory-page.svelte';

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
	header: StepHeader;
};

export const STEPS: Record<StepName, Step> = {
	incoming: {
		step: 1,
		component: MonthIncomePage,
		next: 'mandatory',
		prev: null,
		header: {
			title: 'New month'
		}
	},
	mandatory: {
		step: 2,
		component: MandatoryPage,
		next: null,
		prev: 'incoming',
		onNext: () => {},
		onPrev: () => {},
		header: {
			leftIcon: ArrowLeft
		}
	}
};

export function getStepName(step: number) {
	return Object.keys(STEPS)[step - 1] as StepName;
}

export type IncomingStore = {
	type: 'incoming';
	value: string;
};

/** Строка «не распределено» всегда одна и считается как value минус сумма кастомных статей */
export type MandatoryBreakdownLineKind = 'unallocated' | 'custom';

export type MandatoryBreakdownLine = {
	/** Стабильный ключ для `{#each ... (id)}` */
	id: string;
	kind: MandatoryBreakdownLineKind;
	/** Подпись к статье расхода (для «не распределено» фиксирована в UI) */
	label: string;
	/** Сумма строки для `custom`; для `unallocated` синхронизируется из value − сумма(custom) */
	amount: string;
};

export type MandatoryStore = {
	type: 'mandatory';
	value: string;
	/** Разбивка суммы по статьям: что это и сколько */
	breakdown: MandatoryBreakdownLine[];
};

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
		value: '',
		breakdown: []
	}
});

export const DEFAULT_STEP_NAME: StepName = 'incoming';
