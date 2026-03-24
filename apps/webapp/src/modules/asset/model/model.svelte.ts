import type { AccessibleIconType } from '$shared/config/icons';

type Base = {
	id: string;
	name: string;
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
};

export type AssetType = Base & (AssetBaseType | AssetPricedType);
