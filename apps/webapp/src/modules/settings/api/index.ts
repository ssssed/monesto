import { api } from '$shared/lib/api';
import type { RequestifyResponse } from 'requestify.js';

export async function resetUserData() {
	return api.post<undefined, RequestifyResponse<void>>(
		'/settings/clear-assets-portfolio',
		undefined
	);
}
