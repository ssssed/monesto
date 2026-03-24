import { BanknoteIcon, DollarSign, Gamepad2, GemIcon } from '@lucide/svelte';

export const accessibleIcons = {
	banknote: BanknoteIcon,
	gem: GemIcon,
	dollar: DollarSign,
	gamepad: Gamepad2
};

export type AccessibleIconType = keyof typeof accessibleIcons;
