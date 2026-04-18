import { $api } from '$shared/lib/api';
import type { RequestifyResponse } from 'requestify.js';
import type { AssetType, CreateBaseAssetType, CreatePricedAssetType } from '../model/model.svelte';

export async function getAssets(): Promise<AssetType[]> {
	try {
		const { data } = await $api.get<RequestifyResponse<AssetType[]>>('/assets');

		return data;
	} catch (error) {
		return [];
	}
}

export async function createAsset(
	asset: CreateBaseAssetType | CreatePricedAssetType
): Promise<AssetType> {
	const { data } = await $api.post<
		CreateBaseAssetType | CreatePricedAssetType,
		RequestifyResponse<AssetType>
	>('/assets', asset);

	return data;
}

export async function getAssetBySlug(slug: string): Promise<AssetType> {
	const { data } = await $api.get<RequestifyResponse<AssetType>>(`/assets/${slug}`);
	return data;
}
