export const ACCESSIBLE_ICON_NAMES = [
  'banknote',
  'gem',
  'dollar',
  'gamepad',
  'crypto',
  'briefcase',
] as const;

export type AccessibleIconName = (typeof ACCESSIBLE_ICON_NAMES)[number];

export const DEFAULT_ASSET_SYMBOL = '₽';
