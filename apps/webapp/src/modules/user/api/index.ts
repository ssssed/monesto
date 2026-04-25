import type { CurrencyType } from '$modules/asset';
import { api } from '$shared/lib/api';
import { type RequestifyResponse } from 'requestify.js';
import type { SessionType, UserType } from '../model/model.svelte';

export async function getUserInfo() {
	const { data } = await api.get<RequestifyResponse<{ user: UserType }>>('/auth/me');
	return data.user;
}

export async function startSession(initData: string) {
	const { data } = await api.post<{ initData: string }, RequestifyResponse<SessionType>>(
		'/auth/telegram',
		{
			initData
		}
	);

	return data;
}

export async function getUserSettings() {
	const { data } = await api.get<
		RequestifyResponse<{
			currency: CurrencyType;
			symbol: string;
		}>
	>('/settings');
	return data;
}
