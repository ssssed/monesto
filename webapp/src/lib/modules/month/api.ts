import { api } from '$lib/infrastructures/lib/api';
import { type RequestifyResponse } from 'requestify.js';

type RecentInfoApiType = 'last-incoming' | 'last-mandatory' | 'average';

export type MonthStatus = {
	hasIncoming: boolean;
	hasMandatory: boolean;
	isMonthComplete: boolean;
	incoming: string;
	mandatory: string;
	recentInfo: Partial<
		Record<
			RecentInfoApiType,
			{
				amount: string;
				currency: string;
			}
		>
	>;
};

export const getMonthStatus = async (): Promise<MonthStatus> => {
	return (await api.get<RequestifyResponse<MonthStatus>>('/month/current/status')).data;
};

export type UpdateMonthBodyType = {
	incoming?: string;
	incomingCurrency?: string;
	mandatory?: string;
	mandatoryCurrency?: string;
	strategy?: string;
};

export const updateMonthData = async ({
	month,
	year,
	...body
}: {
	year: number;
	month: number;
} & UpdateMonthBodyType) => api.patch(`/month/${year}/${month}`, body);
