import { browser, dev } from '$app/environment';
import { PUBLIC_TEST_TOKEN } from '$env/static/public';
import { userStore } from '$modules/user';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	if (!browser) return;

	const initData = browser && dev ? PUBLIC_TEST_TOKEN : window.Telegram.WebApp.initData;
	await userStore.startSession(initData);
};
