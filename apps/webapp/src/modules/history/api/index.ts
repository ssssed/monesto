import { $api } from '$shared/lib/api';
import type { RequestifyResponse } from 'requestify.js';
import type { HistoryEventDataType, HistoryType } from '../model/model.svelte';

export type HistoriesChartPoint = {
	date: string;
	value: number;
};

export type TransactionHistoriesResponse = {
	histories: HistoryType[];
	chart: HistoriesChartPoint[];
};

export async function getTransactionHistories(
	slug: string,
	period?: '1M' | '3M' | '6M' | '1Y' | 'ALL'
) {
	const { data } = await $api.get<RequestifyResponse<TransactionHistoriesResponse>>(
		`/assets/${slug}/transactions`,
		{
			query: period ? { period } : undefined
		}
	);
	return data;
}

export async function createTransactionHistory(slug: string, body: HistoryEventDataType) {
	const { data } = await $api.post<HistoryEventDataType, RequestifyResponse<HistoryType>>(
		`/assets/${slug}/transactions`,
		body
	);
	return data;
}
