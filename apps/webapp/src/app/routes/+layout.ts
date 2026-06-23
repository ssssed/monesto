import { browser, dev } from '$app/environment';
import { PUBLIC_TEST_TOKEN } from '$env/static/public';
import { applyMonthStatusToStepStore, getMonthStatus } from '$modules/month';
import { userStore } from '$modules/user';
import { ROUTER } from '$shared/config/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	if (!browser) return;

	const initData = browser && dev ? PUBLIC_TEST_TOKEN : window.Telegram.WebApp.initData;
	await userStore.startSession(initData);

	const today = new Date();
	const monthStatus = await getMonthStatus({
		month: today.getMonth() + 1,
		year: today.getFullYear()
	});

	console.log('month status', monthStatus);

	applyMonthStatusToStepStore(monthStatus.data);
	if (url.pathname !== ROUTER.month && monthStatus.data.status !== 'complete') {
		return redirect(308, ROUTER.month);
	}
};
