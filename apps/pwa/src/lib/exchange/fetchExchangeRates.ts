/** Browser-safe USD/RUB rate. Falls back when CORS blocks Bystrobank. */

const FALLBACK_USD_RUB = 82;

/**
 * Prefer live rate via public FX API; fall back to a stable default for offline/CORS.
 */
export async function fetchUsdRubRate(): Promise<number> {
  try {
    const response = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) throw new Error(`FX API ${response.status}`);
    const data = (await response.json()) as {
      rates?: { RUB?: number };
    };
    const rub = data.rates?.RUB;
    if (typeof rub === 'number' && Number.isFinite(rub) && rub > 0) {
      // +2.5% bank commission to mirror mobile behaviour
      return Math.round(rub * 1.025 * 100) / 100;
    }
  } catch {
    // ignore — use fallback
  }
  return FALLBACK_USD_RUB;
}

export function parseUsdColumnFromTable(_html: string): null {
  return null;
}
