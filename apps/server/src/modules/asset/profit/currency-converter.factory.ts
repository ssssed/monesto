import { Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';
import type { CurrencyConversionStrategy } from './currency-conversion.strategy';
import { GoldCurrencyConversionStrategy } from './strategies/gold-currency-conversion.strategy';
import { RubCurrencyConversionStrategy } from './strategies/rub-currency-conversion.strategy';
import { UsdCurrencyConversionStrategy } from './strategies/usd-currency-conversion.strategy';

@Injectable()
export class CurrencyConverterFactory {
  private readonly bySource: Map<Currency, CurrencyConversionStrategy>;

  constructor(
    rub: RubCurrencyConversionStrategy,
    usd: UsdCurrencyConversionStrategy,
    gold: GoldCurrencyConversionStrategy,
  ) {
    this.bySource = new Map<Currency, CurrencyConversionStrategy>();
    this.bySource.set(Currency.rub, rub);
    this.bySource.set(Currency.usd, usd);
    this.bySource.set(Currency.gold, gold);
  }

  getStrategy(sourceCurrency: Currency): CurrencyConversionStrategy {
    const strategy = this.bySource.get(sourceCurrency);
    if (!strategy) {
      throw new Error(`No currency conversion strategy for ${sourceCurrency}`);
    }
    return strategy;
  }

  convert(value: number, from: Currency, to: Currency): number {
    return this.getStrategy(from).convert(value, to);
  }
}
