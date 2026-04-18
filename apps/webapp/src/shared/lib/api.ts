import { PUBLIC_API_URL, PUBLIC_TEST_TOKEN } from '$env/static/public';
import { defineMiddleware, HttpClient, jsonFormatMiddleware } from 'requestify.js';

const telegramMiddleware = defineMiddleware({
	name: 'telegram',
	before(config) {
		config.headers = {
			...config.headers,
			'X-User-Id': PUBLIC_TEST_TOKEN
		};
		return config;
	}
});

export const $api = new HttpClient({
	baseUrl: `${PUBLIC_API_URL}/api`,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	},
	middlewares: [jsonFormatMiddleware, telegramMiddleware]
});
