import { TransactionType, type Currency } from '@prisma/client';
import type { CurrencyConverterFactory } from '../../asset/profit/currency-converter.factory';
import type { TopUpCalculationResult } from './top-up-calculation.strategy';

const MIN_QUANTITY = 1e-6;

export function moneyInBaseToTopUp(
  amountInBase: number,
  baseCurrency: Currency,
  assetCurrency: Currency,
  converters: CurrencyConverterFactory,
): TopUpCalculationResult | null {
  if (!Number.isFinite(amountInBase) || amountInBase <= 0) {
    return null;
  }

  const quantity = converters.convert(
    amountInBase,
    baseCurrency,
    assetCurrency,
  );

  if (!Number.isFinite(quantity) || quantity < MIN_QUANTITY) {
    return null;
  }

  return {
    quantity,
    pricePerUnit: 1,
    type: TransactionType.buy,
  };
}
