import { generateSlug } from '$shared/lib/slug';
import type { AssetType } from './model.svelte';

export const __ASSETS_MOCK__: AssetType[] = [
	{
		id: '1',
		name: 'Сбережения',
		slug: generateSlug('Сбережения'),
		type: 'base',
		symbol: '₽',
		price: 350000,
		icon: {
			name: 'banknote',
			backgroundColor: '#DBEAFE',
			color: '#3B82F6'
		}
	},
	{
		id: '2',
		name: 'Золото',
		slug: generateSlug('Золото'),
		type: 'priced',
		symbol: 'г',
		price: 185000,
		priceChange: 15.2,
		count: 1000,
		icon: {
			name: 'gem',
			backgroundColor: '#FEF3C7',
			color: '#B45309'
		}
	},
	{
		id: '3',
		name: 'USD',
		slug: generateSlug('USD'),
		type: 'priced',
		symbol: '$',
		price: 92400,
		priceChange: 8.4,
		count: 1150,
		icon: {
			name: 'dollar',
			backgroundColor: '#DCFCE7',
			color: '#16A34A'
		}
	},
	{
		id: '4',
		name: 'CS Инвентарь',
		slug: generateSlug('CS Инвентарь'),
		type: 'priced',
		symbol: '$',
		price: 45000,
		priceChange: -3.1,
		count: 562.5,
		icon: {
			name: 'gamepad',
			backgroundColor: '#EDE9FE',
			color: '#7C3AED'
		}
	}
];
