import type { AssetIconName } from '@/lib/providers/assetIcons';

export const shell = 'mx-auto w-full px-5 pt-6 pb-[110px]';
export const nestedShell = 'mx-auto w-full px-5 pt-6 pb-8';
export const formShell = 'mx-auto flex h-full min-h-0 w-full flex-col px-5 pt-6';
export const formScroll =
  'min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-4';
export const UNDO_MS = 7000;
export const defaults = {
  icon: 'wallet' as AssetIconName,
  bgColor: '#DBEAFE',
  iconColor: '#2563EB'
};
export const numeric = (value: string) => Math.max(0, Number(value.replace(',', '.')) || 0);
