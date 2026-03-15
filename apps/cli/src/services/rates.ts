import { Parser } from './parser.js';

const FALLBACK_USD_RUB = 95;
const FALLBACK_GOLD_PER_GRAM_RUB = 13232.09;

export async function getUsdToRubRate(): Promise<number> {
  try {
    const usd = await Parser.getUsdCourse();
    return usd;
  } catch {
    return FALLBACK_USD_RUB;
  }
}

export async function getGoldPricePerGramRub(): Promise<number> {
  try {
    // TODO: подключить парсер золота по аналогии с USD, когда будет URL/разметка
    return FALLBACK_GOLD_PER_GRAM_RUB;
  } catch {
    return FALLBACK_GOLD_PER_GRAM_RUB;
  }
}
