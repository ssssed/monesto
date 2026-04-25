import { generateSlug } from '$shared/lib/slug';
import type { AssetType } from './model.svelte';

export const __ASSETS_MOCK__: AssetType[] = [
	{
		id: '1',
		name: 'Сбережения',
		slug: generateSlug('Сбережения'),
		currency: 'rub',
		symbol: '₽',
		price: 350000, // текущая стоимость
		profit: {
			amount: 0,
			percent: 0
		},
		count: 350000,
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
		currency: 'rub',
		symbol: 'г',
		price: 185000, // текущая стоимость
		profit: {
			amount: 24400, // 185000 - 160600
			percent: 15.2
		},
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
		currency: 'usd',
		symbol: '$',
		price: 92400, // текущая стоимость (1150 * ~80.35)
		profit: {
			amount: 7160, // 92400 - 85240
			percent: 8.4
		},
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
		currency: 'usd',
		symbol: '$',
		price: 45000,
		profit: {
			amount: -1440, // 45000 - 46440
			percent: -3.1
		},
		count: 562.5,
		icon: {
			name: 'gamepad',
			backgroundColor: '#EDE9FE',
			color: '#7C3AED'
		}
	}
];
