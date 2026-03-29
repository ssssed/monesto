export type FormatMoneyOptions = {
	symbolPosition?: 'left' | 'right';
};

export function formatMoney(amount: number, symbol: string = '₽', options?: FormatMoneyOptions) {
	const { symbolPosition = 'left' } = options ?? {};
	const formatted = new Intl.NumberFormat('ru-RU', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(amount);
	const narrowSpace = '\u202F';
	if (symbolPosition === 'right') {
		return `${formatted}${narrowSpace}${symbol}`;
	}
	return `${symbol}${narrowSpace}${formatted}`;
}
