import { backgroundColors, colors } from '$shared/config/colors';
import type { AccessibleIconType } from '$shared/config/icons';
import { createAsset } from '../api';

export type CurrencyType = 'rub' | 'usd';

export type AssetType = {
	id: string;
	name: string;
	slug: string;
	currency: CurrencyType;
	symbol: string;
	price: number;
	profit: {
		amount: number;
		percent: number;
	};
	count: number;
	icon: IconType;
};

type IconType = {
	name: AccessibleIconType;
	backgroundColor: string;
	color: string;
};

export type AssetInUserCurrency = 'local';
export type AssetInAnotherCurrency = 'another';

export type CreateAssetType = {
	name: string;
	currency: CurrencyType;
	icon: IconType;
};

export const DEFAULT_ASSET_ICON = {
	name: 'banknote' as AccessibleIconType,
	color: colors[0],
	backgroundColor: backgroundColors[0]
} as const;

export const DEFAULT_CREATE_ASSET = {
	name: '',
	icon: DEFAULT_ASSET_ICON,
	currency: 'usd'
};

export class AssetsStore {
	constructor(initialAssets: AssetType[]) {
		this.assets = structuredClone(initialAssets);
	}

	assets: AssetType[] = $state([]);

	async createAsset(data: CreateAssetType) {
		try {
			const asset = await createAsset(data);
			this.addAsset(asset);
		} catch (error) {
			console.error(error);
		}
	}

	private addAsset(asset: AssetType) {
		this.assets.push(asset);
	}
}

export const ASSET_STORE_CONTEXT = '@monesto/asset-store-context';