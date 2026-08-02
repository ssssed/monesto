/** Browser-safe USD/RUB rate with live → cache → fallback cascade. */

export const FALLBACK_USD_RUB = 82;

export type RateSource = 'live' | 'cache' | 'fallback';

export type UsdRubQuote = {
  rate: number;
  source: RateSource;
  fetchedAt: string | null;
};

const CACHE_KEY = 'monesto-usd-rub-quote';

type CachedQuote = {
  rate: number;
  fetchedAt: string;
};

function readCache(): CachedQuote | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedQuote;
    if (
      typeof parsed.rate === 'number' &&
      Number.isFinite(parsed.rate) &&
      parsed.rate > 0 &&
      typeof parsed.fetchedAt === 'string'
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeCache(rate: number): void {
  const payload: CachedQuote = {
    rate,
    fetchedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

/**
 * Prefer live rate via public FX API; then last cached; then stable default.
 * Rate includes +2.5% bank commission to mirror mobile behaviour.
 */
export async function fetchUsdRubQuote(): Promise<UsdRubQuote> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`FX API ${response.status}`);
    const data = (await response.json()) as {
      rates?: { RUB?: number };
    };
    const rub = data.rates?.RUB;
    if (typeof rub === 'number' && Number.isFinite(rub) && rub > 0) {
      const rate = Math.round(rub * 1.025 * 100) / 100;
      writeCache(rate);
      return {
        rate,
        source: 'live',
        fetchedAt: new Date().toISOString(),
      };
    }
  } catch {
    // fall through
  }

  const cached = readCache();
  if (cached) {
    return {
      rate: cached.rate,
      source: 'cache',
      fetchedAt: cached.fetchedAt,
    };
  }

  return {
    rate: FALLBACK_USD_RUB,
    source: 'fallback',
    fetchedAt: null,
  };
}

/** @deprecated Prefer fetchUsdRubQuote — kept for call-site simplicity. */
export async function fetchUsdRubRate(): Promise<number> {
  return (await fetchUsdRubQuote()).rate;
}

export function parseUsdColumnFromTable(_html: string): null {
  return null;
}

export function rateSourceLabel(source: RateSource): string {
  switch (source) {
    case 'live':
      return 'онлайн';
    case 'cache':
      return 'из кэша';
    case 'fallback':
      return 'запасной';
  }
}
