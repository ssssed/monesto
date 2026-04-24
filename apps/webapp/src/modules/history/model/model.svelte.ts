import type { AssetType } from '$modules/asset';
import { createTransactionHistory } from '../api';

export class HistoryStore {
	constructor(
		private readonly asset: AssetType,
		initialHistories: HistoryType[]
	) {
		this.histories = structuredClone(initialHistories);
	}

	histories: HistoryType[] = $state([]);

	async addHistory(data: HistoryEventDataType) {
		try {
			const history = await createTransactionHistory(this.asset.slug, data);
			this.histories.push(history);
		} catch (error) {
			console.error(error);
		}
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
