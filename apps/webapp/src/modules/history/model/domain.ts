export function isCreateHistoryEventDisabled(data: { price: string; count: string }) {
	return data.count.length <= 0 || data.price.length <= 0;
}

export function calculateTotal(data: { price: string; count: string }) {
	return parseFloat(data.count || '0') * parseFloat(data.price || '0');
}
