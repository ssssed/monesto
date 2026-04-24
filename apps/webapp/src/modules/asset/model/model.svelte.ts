import { backgroundColors, colors } from '$shared/config/colors';
import type { AccessibleIconType } from '$shared/config/icons';
import { createAsset } from '../api';

type Base = {
	id: string;
	name: string;
	slug: string;
	symbol: string;
	price: number;
	icon: IconType;
};

type IconType = {
	name: AccessibleIconType;
	backgroundColor: string;
	color: string;
};

type AssetBaseType = {
	type: 'base';
};

type AssetPricedType = {
	type: 'priced';
	priceChange: number;
	count: number;
};

export type AssetType = Base & (AssetBaseType | AssetPricedType);

export type CreateBaseAssetType = {
	type: 'base';
	name: string;
	icon: IconType;
};

export type CreatePricedAssetType = {
	type: 'priced';
	name: string;
	unit: string;
	icon: IconType;
};

export const defaultBaseAsset: CreateBaseAssetType = {
	icon: {
		name: 'banknote',
		color: colors[0],
		backgroundColor: backgroundColors[0]
	},
	name: '',
	type: 'base'
};

export const defaultPricedAsset: CreatePricedAssetType = {
	icon: {
		name: 'banknote',
		color: colors[0],
		backgroundColor: backgroundColors[0]
	},
	name: '',
	unit: '',
	type: 'priced'
};

export class AssetsStore {
	constructor(initialAssets: AssetType[]) {
		this.assets = structuredClone(initialAssets);
	}

	assets: AssetType[] = $state([]);

	async createAsset(data: CreateBaseAssetType | CreatePricedAssetType) {
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
