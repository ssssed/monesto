import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const ASSET_ICON_OPTIONS: { name: IoniconName; label: string }[] = [
  { name: 'wallet-outline', label: 'Кошелёк' },
  { name: 'cash-outline', label: 'Наличные' },
  { name: 'logo-usd', label: 'USD' },
  { name: 'diamond-outline', label: 'Золото' },
  { name: 'trending-up-outline', label: 'Рост' },
  { name: 'card-outline', label: 'Карта' },
  { name: 'home-outline', label: 'Дом' },
  { name: 'car-outline', label: 'Машина' },
  { name: 'airplane-outline', label: 'Путешествия' },
  { name: 'briefcase-outline', label: 'Работа' },
  { name: 'game-controller-outline', label: 'Игры' },
  { name: 'rocket-outline', label: 'Рокет' },
  { name: 'shield-checkmark-outline', label: 'Подушка' },
  { name: 'sparkles-outline', label: 'Цель' },
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
