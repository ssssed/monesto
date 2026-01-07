import { ONBOARDING_COMPLETE } from '$lib/shared/config/cookie';
import { ROUTER } from '$lib/shared/config/router';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const { cookies, url } = event;

	// Получаем cookie, например 'onboarding_completed'
	const onboardingCompleted = cookies.get(ONBOARDING_COMPLETE);

	// Текущий путь
	const path = url.pathname;

	// Если пользователь уже прошёл onboarding и заходит на /onboarding → редирект на /
	if (onboardingCompleted && path.startsWith(ROUTER.onboarding)) {
		throw redirect(302, ROUTER.home);
	}

	// Если пользователь НЕ прошёл onboarding и заходит не на /onboarding → редирект на /onboarding
	if (!onboardingCompleted && path !== ROUTER.onboarding) {
		throw redirect(302, ROUTER.onboarding);
	}

	// Иначе просто продолжаем обработку
	return await resolve(event);
};
