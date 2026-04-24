import { getAssets } from '$modules/asset';

export const load = async () => {
	const assets = await getAssets();
	return {
		assets
	};
};
