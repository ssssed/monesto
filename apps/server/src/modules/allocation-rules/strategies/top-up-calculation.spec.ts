import {
  AllocationTopUpType,
  Currency,
  TransactionType,
  type AllocationRule,
  type Asset,
} from '@prisma/client';
import { CurrencyConverterFactory } from '../../asset/profit/currency-converter.factory';
import { GoldCurrencyConversionStrategy } from '../../asset/profit/strategies/gold-currency-conversion.strategy';
import { RubCurrencyConversionStrategy } from '../../asset/profit/strategies/rub-currency-conversion.strategy';
import { UsdCurrencyConversionStrategy } from '../../asset/profit/strategies/usd-currency-conversion.strategy';
import { FixedAmountTopUpStrategy } from './fixed-amount-top-up.strategy';
import { PercentTopUpStrategy } from './percent-top-up.strategy';
import { QuantityTopUpStrategy } from './quantity-top-up.strategy';
import type { TopUpCalculationContext } from './top-up-calculation.context';

function makeRule(
  topUpType: AllocationTopUpType,
  value: number,
): AllocationRule {
  return {
    id: 1,
    userId: 1,
    assetId: 1,
    topUpType,
    value: value as unknown as AllocationRule['value'],
    executionDate: new Date('2026-06-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeAsset(currency: Currency): Asset {
  return {
    id: 1,
    userId: 1,
    name: 'Test',
    slug: 'test',
    currency,
  };
}

function makeContext(
  partial: Partial<TopUpCalculationContext> & {
    topUpType: AllocationTopUpType;
    value: number;
    assetCurrency: Currency;
  },
): TopUpCalculationContext {
  const { topUpType, value, assetCurrency, ...rest } = partial;
  return {
    rule: makeRule(topUpType, value),
    asset: makeAsset(assetCurrency),
    baseCurrency: Currency.rub,
    netIncomeInBase: 100_000,
    ...rest,
  };
}

describe('Top-up calculation strategies', () => {
  const rub = new RubCurrencyConversionStrategy();
  const usd = new UsdCurrencyConversionStrategy();
  const gold = new GoldCurrencyConversionStrategy();
  const factory = new CurrencyConverterFactory(rub, usd, gold);

  const percent = new PercentTopUpStrategy(factory);
  const fixed = new FixedAmountTopUpStrategy(factory);
  const quantity = new QuantityTopUpStrategy();

  it('percent: 15% от 100 000 RUB → 15 000 RUB на RUB-актив', () => {
    const result = percent.calculate(
      makeContext({
        topUpType: AllocationTopUpType.percent,
        value: 15,
        assetCurrency: Currency.rub,
      }),
    );

    expect(result).toEqual({
      quantity: 15_000,
      pricePerUnit: 1,
      type: TransactionType.buy,
    });
  });

  it('percent: 10% от 100 000 RUB → 100 USD на USD-актив', () => {
    const result = percent.calculate(
      makeContext({
        topUpType: AllocationTopUpType.percent,
        value: 10,
        assetCurrency: Currency.usd,
      }),
    );

    expect(result).toEqual({
      quantity: 100,
      pricePerUnit: 1,
      type: TransactionType.buy,
    });
  });

  it('fixed_amount: 50 000 RUB на USD-актив', () => {
    const result = fixed.calculate(
      makeContext({
        topUpType: AllocationTopUpType.fixed_amount,
        value: 50_000,
        assetCurrency: Currency.usd,
      }),
    );

    expect(result).toEqual({
      quantity: 500,
      pricePerUnit: 1,
      type: TransactionType.buy,
    });
  });

  it('quantity: фиксированное количество единиц', () => {
    const result = quantity.calculate(
      makeContext({
        topUpType: AllocationTopUpType.quantity,
        value: 5,
        assetCurrency: Currency.gold,
      }),
    );

    expect(result).toEqual({
      quantity: 5,
      pricePerUnit: 1,
      type: TransactionType.buy,
    });
  });

  it('percent: нулевой доход → пропуск', () => {
    const result = percent.calculate(
      makeContext({
        topUpType: AllocationTopUpType.percent,
        value: 15,
        assetCurrency: Currency.rub,
        netIncomeInBase: 0,
      }),
    );

    expect(result).toBeNull();
  });
});
