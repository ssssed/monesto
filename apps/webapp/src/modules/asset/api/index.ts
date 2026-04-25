import { api } from '$shared/lib/api';
import type { RequestifyResponse } from 'requestify.js';
import type { AssetType, CreateAssetType } from '../model/model.svelte';

export async function getAssets(): Promise<AssetType[]> {
	try {
		console.log('assets', api.middlewares);

		const { data } = await api.get<RequestifyResponse<AssetType[]>>('/assets');
		return data;
	} catch {
		return [];
	}
}

export async function createAsset(asset: CreateAssetType): Promise<AssetType> {
	const { data } = await api.post<CreateAssetType, RequestifyResponse<AssetType>>('/assets', asset);

	return data;
}

export async function getAssetBySlug(slug: string): Promise<AssetType> {
	const { data } = await api.get<RequestifyResponse<AssetType>>(`/assets/${slug}`);
	return data;
}
