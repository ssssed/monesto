import type { AssetType } from '$modules/asset';

export function isCreateHistoryEventDisabled(
	mode: AssetType['type'],
	data: { price: string; count: string }
) {
	switch (mode) {
		case 'base':
			return data.price.length <= 0;
		case 'priced':
			return data.count.length <= 0 || data.price.length <= 0;
		default:
			return true;
	}
}

export function calculateTotal(mode: AssetType['type'], data: { price: string; count: string }) {
	switch (mode) {
		case 'base':
			return parseFloat(data.price || '0');
		case 'priced':
			return parseFloat(data.count || '0') * parseFloat(data.price || '0');
		default:
			throw new Error(`${mode} is not supported`);
	}
}
