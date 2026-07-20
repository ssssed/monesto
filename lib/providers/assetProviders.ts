import type { AssetProvider } from '@/lib/types';

export const ASSET_PROVIDERS: Record<
  AssetProvider,
  { label: string; symbol: string; enabled: boolean }
> = {
  rub: { label: '₽', symbol: '₽', enabled: true },
  usd: { label: 'USD', symbol: '$', enabled: true },
  gold: { label: 'Золото', symbol: 'Au', enabled: false },
  steam: { label: 'Steam', symbol: 'ST', enabled: false },
};

export function getEnabledProviders(): AssetProvider[] {
  return (Object.keys(ASSET_PROVIDERS) as AssetProvider[]).filter(
    (key) => ASSET_PROVIDERS[key].enabled,
  );
}
