import { PUBLIC_TELEGRAM_DEV_ID } from '$env/static/public';
import { defineMiddleware } from 'requestify.js';

export const getTelegramId = () => {
	if (typeof window === 'undefined') return;

	const devTelegramId = PUBLIC_TELEGRAM_DEV_ID;
	const telegramId = String(window.Telegram.WebApp.initDataUnsafe.user?.id);

	return devTelegramId ?? telegramId;
};

export const telegramMiddleware = defineMiddleware({
	name: 'telegram',
	before: (config) => {
		const telegramId = getTelegramId();

		if (telegramId) {
			config.headers = {
				...config.headers,
				'x-telegram-id': telegramId
			};
		}

		return config;
	}
});
