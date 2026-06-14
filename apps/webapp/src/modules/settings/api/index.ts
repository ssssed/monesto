import { api } from '$shared/lib/api';
import type { RequestifyResponse } from 'requestify.js';
import type { RuleType } from '../model/model.svelte';

export async function resetUserData() {
	return api.post<undefined, RequestifyResponse<void>>(
		'/settings/clear-assets-portfolio',
		undefined
	);
}

export const getAllocationRules = async () => {
	return (await api.get<RequestifyResponse<RuleType[]>>('/allocation-rules')).data;
};
