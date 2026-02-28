import { ONBOARDING_COMPLETE } from '$lib/shared/config/cookie';
import { ROUTER } from '$lib/shared/config/router';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ cookies }) => {
		cookies.set(ONBOARDING_COMPLETE, 'true', {
			path: ROUTER.home,
			httpOnly: true,
			sameSite: 'lax'
		});

		throw redirect(303, ROUTER.home);
	}
} as Actions;
