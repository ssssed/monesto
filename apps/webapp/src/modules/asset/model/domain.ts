import type { AssetType, CreateBaseAssetType, CreatePricedAssetType } from './model.svelte';

export function isDisabledSubmit(data: CreateBaseAssetType | CreatePricedAssetType) {
	switch (data.type) {
		case 'base':
			return data.name.length <= 0;
		case 'priced':
			return data.name.length <= 0 || data.unit.length <= 0;
		default:
			return true;
	}
}

export function getCreateAssetDataByType(
	type: AssetType['type'],
	base: CreateBaseAssetType,
	priced: CreatePricedAssetType
) {
	switch (type) {
		case 'base':
			return base;
		case 'priced':
			return priced;
	}
}
