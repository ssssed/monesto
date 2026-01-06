import { api } from '$lib/infrastructures/lib/api';

export const getMonthStatus = async () => {
	return (await api.get('/month/current/status')).data as {
		hasIncoming: boolean;
		hasMandatory: boolean;
		isMonthComplete: boolean;
	};
};
