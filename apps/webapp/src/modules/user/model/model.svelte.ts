import type { CurrencyType } from '$modules/asset';
import { SESSION_TOKEN_KEY } from '$shared/lib/api';
import { getUserInfo, getUserSettings, startSession } from '../api';

type LanguageCode = 'ru' | 'en';

export type UserType = {
	id: string;
	telegramId: string;
	firstName: string;
	lastName: string;
	username: string;
	languageCode: LanguageCode;
	registerAt: string;
	updateAt: string;
};

export type SessionType = {
	user: Pick<UserType, 'id' | 'telegramId' | 'firstName' | 'lastName'>;
	sessionToken: string;
};

function saveSessionToken(sessionToken: string) {
	sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
}

class UserStore {
	user = $state<UserType>();
	userSettings = $state<{
		currency: CurrencyType;
		symbol: string;
	}>();
	sessionToken = $state<string>();

	async startSession(initData: string) {
		try {
			const session = await startSession(initData);
			this.sessionToken = session.sessionToken;
			saveSessionToken(session.sessionToken);

			const [user, userSettings] = await Promise.all([getUserInfo(), getUserSettings()]);
			this.user = user;
			this.userSettings = userSettings;
		} catch (error) {
			console.error(error);
		}
	}
}

export const userStore = new UserStore();
