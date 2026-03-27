import { BanknoteIcon, Bitcoin, Briefcase, DollarSign, Gamepad2, GemIcon } from '@lucide/svelte';

export const accessibleIcons = {
	banknote: BanknoteIcon,
	gem: GemIcon,
	dollar: DollarSign,
	gamepad: Gamepad2,
	crypto: Bitcoin,
	briefcase: Briefcase
};

export type AccessibleIconType = keyof typeof accessibleIcons;
