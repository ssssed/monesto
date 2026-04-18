import { $api } from '$shared/lib/api';
import type { RequestifyResponse } from 'requestify.js';
import type { HistoryEventDataType, HistoryType } from '../model/model.svelte';

export async function getTransactionHistories(slug: string) {
	const { data } = await $api.get<RequestifyResponse<HistoryType[]>>(
		`/assets/${slug}/transactions`
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
