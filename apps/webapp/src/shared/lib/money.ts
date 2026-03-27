export function formatMoney(amount: number, symbol: string = '₽') {
	const formatted = new Intl.NumberFormat('ru-RU', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(amount);
	return `${symbol}\u202F${formatted}`;
}
