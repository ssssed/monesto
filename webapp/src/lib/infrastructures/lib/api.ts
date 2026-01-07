import { HttpClient, jsonFormatMiddleware } from 'requestify.js';
import { PUBLIC_API_URL } from '$env/static/public';
import { telegramMiddleware } from '../telegram';

export const api = new HttpClient({
	baseUrl: PUBLIC_API_URL,
	headers: {
		'Content-Type': 'application/json'
	},
	middlewares: [telegramMiddleware, jsonFormatMiddleware]
});
