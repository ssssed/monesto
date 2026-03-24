export const ROUTER = {
	home: '/',
	onboarding: '/onboarding',
	settings: '/settings'
};

const NAV_BAR_VISIBLE_PATHS = [ROUTER.home, ROUTER.settings];

export function isNavBarVisible(path: string) {
	return NAV_BAR_VISIBLE_PATHS.includes(path);
}
