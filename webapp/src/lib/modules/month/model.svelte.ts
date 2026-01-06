import type { NewMonthStepType } from './constants';

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
