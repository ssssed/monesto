import { __HISTORY_OPERATIONS__ } from './__mocks__';

export class HistoryStore {
	histories: HistoryType[] = $state(__HISTORY_OPERATIONS__);
}

export type HistoryType = {
	id: string;
	type: 'sell' | 'buy';
	date: Date;
	price: number;
	unit: string;
	count: number;
};
