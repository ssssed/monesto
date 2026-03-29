import type { HistoryType } from './model.svelte';

export const __HISTORY_OPERATIONS__: HistoryType[] = [
	{
		id: '1',
		type: 'buy',
		date: new Date(2026, 3, 15),
		price: 6200,
		count: 10,
		unit: 'г'
	},
	{
		id: '2',
		type: 'sell',
		date: new Date(2026, 2, 2),
		price: 6800,
		count: 5,
		unit: 'г'
	},
	{
		id: '3',
		type: 'buy',
		date: new Date(2025, 12, 18),
		price: 5400,
		count: 10,
		unit: 'г'
	},
	{
		id: '4',
		type: 'buy',
		date: new Date(2025, 12, 18),
		price: 4800,
		count: 15,
		unit: 'г'
	}
];

export const __CHART_DATA__ = [
	{ date: '2025-10-01', value: 1200 },
	{ date: '2025-10-15', value: 1400 },
	{ date: '2025-11-01', value: 1800 },
	{ date: '2025-11-15', value: 2100 },
	{ date: '2025-12-01', value: 2400 },
	{ date: '2025-12-15', value: 2600 },
	{ date: '2026-01-01', value: 3100 },
	{ date: '2026-01-15', value: 3300 },
	{ date: '2026-02-01', value: 3800 },
	{ date: '2026-02-15', value: 4200 },
	{ date: '2026-03-01', value: 4700 }
];