import { api } from '$shared/lib/api';
import type { RequestifyResponse } from 'requestify.js';
import type { BreakdownLine, MonthStatusStepState, StepName } from '../model/model.svelte';

type MonthStatusResponse = {
	year: number;
	month: number;
	status: 'empty' | 'partial' | 'complete';
	incoming: MonthStatusStepState;
	mandatory: MonthStatusStepState;
};

export async function getMonthStatus({ year, month }: { month: number; year: number }) {
	return api.get<RequestifyResponse<MonthStatusResponse>>(
		`/finance/month?year=${year}&month=${month}`
	);
}

export async function saveStepData({
	breakdown,
	step,
	value,
	month,
	year
}: {
	year: number;
	month: number;
	step: StepName;
	value: string;
	breakdown: BreakdownLine[];
}) {
	return api.patch<{
		step: StepName;
		value: string;
		breakdown: BreakdownLine[];
	}>(`/finance/month?year=${year}&month=${month}`, {
		step,
		value,
		breakdown
	});
}
