import type { AssetProvider } from '../types';

export const ASSET_PROVIDERS: Record<
  AssetProvider,
  { label: string; symbol: string; enabled: boolean }
> = {
  rub: { label: '₽', symbol: '₽', enabled: true },
  usd: { label: 'USD', symbol: '$', enabled: true },
  credit: { label: 'Кредит', symbol: '₽', enabled: true },
  gold: { label: 'Золото', symbol: 'Au', enabled: false },
  steam: { label: 'Steam', symbol: 'ST', enabled: false },
};

export const CREDIT_DEFAULTS = {
  icon: 'card' as const,
  bgColor: '#FEF2F2',
  iconColor: '#991B1B',
};

export function getEnabledProviders(): AssetProvider[] {
  return (Object.keys(ASSET_PROVIDERS) as AssetProvider[]).filter(
    (key) => ASSET_PROVIDERS[key].enabled,
  );
}

export function isCreditProvider(provider: AssetProvider): boolean {
  return provider === 'credit';
}
