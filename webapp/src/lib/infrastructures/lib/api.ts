import { HttpClient, jsonFormatMiddleware } from 'requestify.js';

export const api = new HttpClient({
	baseUrl: 'http://localhost:8000/api',
	middlewares: [jsonFormatMiddleware]
});
