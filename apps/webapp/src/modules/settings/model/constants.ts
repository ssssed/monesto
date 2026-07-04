import type { TopUpType } from './model.svelte'

export const TOP_UP_TYPE_TEXT_MAPPER: Record<TopUpType, string> = {
	percent: '% от (ЗП - расходы)',
	fixed_amount: ' фиксированно',
	quantity: ''
};
