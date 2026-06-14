import type { AssetType } from '$modules/asset';
import type { DatepickerRangeValue, DatepickerValue } from '@monesto/ui-kit';

export type IncomePayoutFrequency = 'monthly' | 'semimonthly' | 'daily';

export type IncomePayoutDataByType = {
	monthly: {
		payoutDate: DatepickerValue;
	};
	semimonthly: {
		payoutDates: [DatepickerValue, DatepickerValue];
		periods: [DatepickerRangeValue, DatepickerRangeValue];
	};
	daily: Record<string, never>;
};

export type IncomeDetailsFormData = {
	name: string;
	income: string;
	paymentType: IncomePayoutFrequency;
	payoutData: IncomePayoutDataByType;
};

const hasText = (value: string) => value.trim().length > 0;

const hasCompletePeriod = (period: DatepickerRangeValue) => Boolean(period.start && period.end);

export function isIncomeDetailsFormValid(formData: IncomeDetailsFormData): boolean {
	if (!hasText(formData.name) || !hasText(formData.income)) {
		return false;
	}

	switch (formData.paymentType) {
		case 'monthly':
			return Boolean(formData.payoutData.monthly.payoutDate);
		case 'semimonthly':
			return (
				formData.payoutData.semimonthly.payoutDates.every(Boolean) &&
				formData.payoutData.semimonthly.periods.every(hasCompletePeriod)
			);
		case 'daily':
			return true;
	}
}

export type TopUpType = 'percent' | 'fixed_amount' | 'quantity';

export type RuleType = {
	id: string;
	asset: Pick<AssetType, 'name' | 'icon' | 'currency' | 'symbol'>;
	executionDate: string;
	topUpType: TopUpType;
	value: number;
};
