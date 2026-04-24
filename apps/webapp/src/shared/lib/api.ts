import { PUBLIC_API_URL } from '$env/static/public';
import { defineMiddleware, HttpClient, jsonFormatMiddleware } from 'requestify.js';

export const SESSION_TOKEN_KEY = '@monesto/session-token';

const telegramMiddleware = defineMiddleware({
	name: 'telegram',
	before(config) {
		const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
		if (sessionToken)
			config.headers = {
				...config.headers,
				Authorization: `Bearer ${sessionToken}`
			};

		console.log('config', config.headers);
		return config;
	}
});

export const api = new HttpClient({
	baseUrl: `${PUBLIC_API_URL}/api`,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	},
	middlewares: [jsonFormatMiddleware, telegramMiddleware]
});
