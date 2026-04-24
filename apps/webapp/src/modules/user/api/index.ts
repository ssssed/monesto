import { api } from '$shared/lib/api';
import { type RequestifyResponse } from 'requestify.js';
import type { SessionType, UserType } from '../model/model.svelte';

export async function getUserInfo() {
	console.log('getUserInfo', api.middlewares);
	const { data } = await api.get<RequestifyResponse<{ user: UserType }>>('/auth/me');
	return data.user;
}

export async function startSession(initData: string) {
	console.log('start session', api.middlewares);

	const { data } = await api.post<{ initData: string }, RequestifyResponse<SessionType>>(
		'/auth/telegram',
		{
			initData
		}
	);

	return data;
}
