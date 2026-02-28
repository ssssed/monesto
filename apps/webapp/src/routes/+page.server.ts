import { getMonthStatus } from '$lib/modules/month';
import { DEPENDS } from '$lib/shared/config/deepends';
import type { PageServerLoad } from './$types';

// +page.ts или +page.server.ts
export const load: PageServerLoad = async ({ depends }) => {
	depends(DEPENDS.MONTH_STATUS);

	const monthStatus = await getMonthStatus();

	return { monthStatus };
};
