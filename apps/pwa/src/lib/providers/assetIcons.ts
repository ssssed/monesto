import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Car,
  CreditCard,
  DollarSign,
  Gamepad2,
  Gem,
  Home,
  Plane,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Banknote,
} from 'lucide-react';

export type AssetIconName =
  | 'wallet'
  | 'cash'
  | 'usd'
  | 'diamond'
  | 'trending'
  | 'card'
  | 'home'
  | 'car'
  | 'plane'
  | 'briefcase'
  | 'gamepad'
  | 'rocket'
  | 'shield'
  | 'sparkles';

export const ASSET_ICON_MAP: Record<AssetIconName, LucideIcon> = {
  wallet: Wallet,
  cash: Banknote,
  usd: DollarSign,
  diamond: Gem,
  trending: TrendingUp,
  card: CreditCard,
  home: Home,
  car: Car,
  plane: Plane,
  briefcase: Briefcase,
  gamepad: Gamepad2,
  rocket: Rocket,
  shield: ShieldCheck,
  sparkles: Sparkles,
};

export const ASSET_ICON_OPTIONS: { name: AssetIconName; label: string }[] = [
  { name: 'wallet', label: 'Кошелёк' },
  { name: 'cash', label: 'Наличные' },
  { name: 'usd', label: 'USD' },
  { name: 'diamond', label: 'Золото' },
  { name: 'trending', label: 'Рост' },
  { name: 'card', label: 'Карта' },
  { name: 'home', label: 'Дом' },
  { name: 'car', label: 'Машина' },
  { name: 'plane', label: 'Путешествия' },
  { name: 'briefcase', label: 'Работа' },
  { name: 'gamepad', label: 'Игры' },
  { name: 'rocket', label: 'Рокет' },
  { name: 'shield', label: 'Подушка' },
  { name: 'sparkles', label: 'Цель' },
];

export const BG_COLOR_OPTIONS = [
  '#DBEAFE',
  '#DCFCE7',
  '#FEF3C7',
  '#FCE7F3',
  '#E0E7FF',
  '#FFEDD5',
  '#F1F5F9',
  '#E0F2FE',
  '#CCFBF1',
  '#F3E8FF',
];

export const ICON_COLOR_OPTIONS = [
  '#2563EB',
  '#059669',
  '#D97706',
  '#DB2777',
  '#4F46E5',
  '#EA580C',
  '#0F172A',
  '#0284C7',
  '#0D9488',
  '#7C3AED',
];

/** Map legacy Ionicons names from mobile data to lucide keys. */
export function normalizeIconName(icon: string): AssetIconName {
  const legacy: Record<string, AssetIconName> = {
    'wallet-outline': 'wallet',
    'cash-outline': 'cash',
    'logo-usd': 'usd',
    'diamond-outline': 'diamond',
    'trending-up-outline': 'trending',
    'card-outline': 'card',
    'home-outline': 'home',
    'car-outline': 'car',
    'airplane-outline': 'plane',
    'briefcase-outline': 'briefcase',
    'game-controller-outline': 'gamepad',
    'rocket-outline': 'rocket',
    'shield-checkmark-outline': 'shield',
    'sparkles-outline': 'sparkles',
  };
  if (icon in ASSET_ICON_MAP) return icon as AssetIconName;
  return legacy[icon] ?? 'wallet';
}
