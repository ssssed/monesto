import { api } from '$shared/lib/api';
import type { RequestifyResponse } from 'requestify.js';
import type { CreateRuleType, RuleType } from '../model/model.svelte';

export async function resetUserData() {
	return api.post<undefined, RequestifyResponse<void>>(
		'/settings/clear-assets-portfolio',
		undefined
	);
}

export const getAllocationRules = async () => {
	return (await api.get<RequestifyResponse<RuleType[]>>('/allocation-rules')).data;
};

export async function createRule(data: CreateRuleType) {
	return (await api.post<CreateRuleType, RequestifyResponse<RuleType>>('/allocation-rules', data))
		.data;
}

export async function deleteRule(id: string) {
	return api.delete<RequestifyResponse<void>>(`/allocation-rules/${id}`);
}
