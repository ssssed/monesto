import { getAssetBySlug } from '$modules/asset';
import { getTransactionHistories } from '$modules/history';

export const load = async ({ params }: { params: { slug: string } }) => {
	const [asset, histories] = await Promise.all([
		getAssetBySlug(params.slug),
		getTransactionHistories(params.slug)
	]);

	return {
		asset,
		histories
	};
};
