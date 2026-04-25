import { userStore } from '$modules/user';
import type { CreateAssetType, CurrencyType } from './model.svelte';

export function isDisabledSubmit(data: CreateAssetType) {
	return data.name.length <= 0;
}

export function isLocalCurrency(currency: CurrencyType): boolean {
	return currency === userStore.userSettings?.currency;
}
