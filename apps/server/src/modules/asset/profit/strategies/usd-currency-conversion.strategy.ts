import { Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { RUB_PER_UNIT } from '../hard-coded-fx-rates';
import type { CurrencyConversionStrategy } from '../currency-conversion.strategy';

@Injectable()
export class UsdCurrencyConversionStrategy implements CurrencyConversionStrategy {
  readonly sourceCurrency = Currency.usd;

  convert(value: number, targetCurrency: Currency): number {
    if (targetCurrency === this.sourceCurrency) {
      return value;
    }
    const fromRubPerUnit = RUB_PER_UNIT[this.sourceCurrency];
    const toRubPerUnit = RUB_PER_UNIT[targetCurrency];
    if (toRubPerUnit <= 0) return 0;
    return (value * fromRubPerUnit) / toRubPerUnit;
  }
}
