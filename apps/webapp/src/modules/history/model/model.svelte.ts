import type { AssetType } from '$modules/asset';
import { createTransactionHistory } from '../api';

export type ChartPeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const CHART_PERIOD_FILTERS: ChartPeriod[] = ['1M', '3M', '6M', '1Y', 'ALL'];

export function filterChartPointsByPeriod(points: ChartType[], period: ChartPeriod): ChartType[] {
	if (points.length === 0) return [];

	const now = new Date(points[points.length - 1].date);
	const monthsMap: Record<ChartPeriod, number> = {
		'1M': 1,
		'3M': 3,
		'6M': 6,
		'1Y': 12,
		ALL: 999
	};
	const limit = monthsMap[period];

	return points.filter((item) => {
		const d = new Date(item.date);
		const diff =
			(now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
		return diff < limit;
	});
}

export class HistoryStore {
	constructor(
		private readonly asset: AssetType,
		initialHistories: HistoryType[],
		initialChartSeries: ChartType[]
	) {
		this.histories = structuredClone(initialHistories);
		this.chartSeries = structuredClone(initialChartSeries);
	}

	histories: HistoryType[] = $state([]);
	chartSeries: ChartType[] = $state([]);
	chartPeriod: ChartPeriod = $state('6M');

	setChartPeriod(period: ChartPeriod) {
		this.chartPeriod = period;
	}

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

export type ChartType = {
	date: string;
	value: number;
};

export type HistoryEventDataType = {
	type: 'sell' | 'buy';
	count: string;
	price: string;
};
