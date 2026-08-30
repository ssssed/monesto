import { FxProviderCode } from '@prisma/client';

export interface FxRateQuote {
  quote: string;
  rate: number;
}

/**
 * Контракт для источника курсов валют. Сегодня есть только один провайдер
 * (open-er-api, только USD-база), но добавление нового источника или базовой
 * валюты (EUR и т.д.) — это только новый класс + одна строка в FxModule.
 */
export interface FxProvider {
  readonly code: FxProviderCode;
  fetchRates(base: string): Promise<FxRateQuote[]>;
}

export const FX_PROVIDERS = Symbol('FX_PROVIDERS');
