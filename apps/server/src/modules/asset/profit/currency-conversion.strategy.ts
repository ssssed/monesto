import { Currency } from '@prisma/client';

export interface CurrencyConversionStrategy {
  readonly sourceCurrency: Currency;

  /**
   * Конвертирует value из sourceCurrency в targetCurrency.
   * Если валюты совпадают — возвращает value без изменений.
   */
  convert(value: number, targetCurrency: Currency): number;
}
