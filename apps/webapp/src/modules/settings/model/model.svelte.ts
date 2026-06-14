import type { AssetType } from '$modules/asset';
import type { DatepickerRangeValue, DatepickerValue } from '@monesto/ui-kit';
import { getContext, setContext } from 'svelte';
import { createRule, deleteRule as deleteRuleApi } from '../api';

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

export type CreateRuleType = {
	assetSlug: string;
	topUpType: TopUpType;
	value: number;
	executionDate: string;
};

const ALLOCATE_RULES_STORE_CONTEXT_KEY = '@monesto/allocate-rules-store-context';

export class AllocateRulesStore {
	constructor(initial: RuleType[]) {
		this.rules = structuredClone(initial);
	}

	rules: RuleType[] = $state([]);

	async createRule(data: CreateRuleType) {
		try {
			const rule = await createRule(data);

			this.addRule(rule);
		} catch (error) {
			console.error(error);
		}
	}

	private addRule(rule: RuleType) {
		this.rules.push(rule);
	}

	async deleteRule(id: string) {
		try {
			await deleteRuleApi(id);

			this.rules = this.rules.filter((rule) => rule.id !== id);
		} catch (error) {
			console.error(error);
		}
	}

	saveToContext() {
		setContext(ALLOCATE_RULES_STORE_CONTEXT_KEY, this);
		return this;
	}

	static getContext() {
		return getContext(ALLOCATE_RULES_STORE_CONTEXT_KEY) as AllocateRulesStore;
	}
}
