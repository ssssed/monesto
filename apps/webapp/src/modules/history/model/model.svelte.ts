import type { AssetType } from '$modules/asset';
import { __HISTORY_OPERATIONS__ } from './__mocks__';

export class HistoryStore {
	constructor(private readonly asset: AssetType) {}

	histories: HistoryType[] = $state(__HISTORY_OPERATIONS__);

	addHistory(data: HistoryEventDataType) {
		this.histories.push({
			id: crypto.randomUUID(),
			date: new Date(),
			unit: this.asset.symbol,
			count: this.asset.type === 'priced' ? +data.count : 1,
			price: parseFloat(data.price),
			type: data.type
		});
	}
}

export type HistoryType = {
	id: string;
	type: 'sell' | 'buy';
	date: Date;
	price: number;
	unit: string;
	count: number;
};

export type HistoryEventDataType = {
	type: 'sell' | 'buy';
	count: string;
	price: string;
};
