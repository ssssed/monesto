import { Currency } from '@prisma/client';
import { CurrencyConverterFactory } from './currency-converter.factory';
import { ProfitCalculatorService } from './profit-calculator.service';
import { GoldCurrencyConversionStrategy } from './strategies/gold-currency-conversion.strategy';
import { RubCurrencyConversionStrategy } from './strategies/rub-currency-conversion.strategy';
import { UsdCurrencyConversionStrategy } from './strategies/usd-currency-conversion.strategy';

describe('Profit + per-currency converters', () => {
  const rub = new RubCurrencyConversionStrategy();
  const usd = new UsdCurrencyConversionStrategy();
  const gold = new GoldCurrencyConversionStrategy();
  const factory = new CurrencyConverterFactory(rub, usd, gold);
  const profitCalculator = new ProfitCalculatorService(factory);

  it('Scenario 1: baseCurrency RUB, RUB asset has zero growth', () => {
    const result = profitCalculator.calculate({
      baseCurrency: Currency.rub,
      to: { currency: Currency.rub, value: 10_000 },
      from: { currency: Currency.rub, value: 10_000 },
    });

    expect(result.currentValueInBase).toBe(10_000);
    expect(result.investedInBase).toBe(10_000);
    expect(result.amount).toBe(0);
    expect(result.percent).toBe(0);
  });

  it('Scenario 1: baseCurrency RUB, USD asset grows by 25%', () => {
    const result = profitCalculator.calculate({
      baseCurrency: Currency.rub,
      to: { currency: Currency.usd, value: 100 },
      from: { currency: Currency.rub, value: 8_000 },
    });

    expect(result.currentValueInBase).toBe(10_000);
    expect(result.investedInBase).toBe(8_000);
    expect(result.amount).toBe(2_000);
    expect(result.percent).toBe(25);
  });

  it('Scenario 2: baseCurrency USD, USD asset has zero growth', () => {
    const result = profitCalculator.calculate({
      baseCurrency: Currency.usd,
      to: { currency: Currency.usd, value: 100 },
      from: { currency: Currency.usd, value: 100 },
    });

    expect(result.currentValueInBase).toBe(100);
    expect(result.investedInBase).toBe(100);
    expect(result.amount).toBe(0);
    expect(result.percent).toBe(0);
  });

  it('Scenario 2: baseCurrency USD, RUB asset drops by 20%', () => {
    const result = profitCalculator.calculate({
      baseCurrency: Currency.usd,
      to: { currency: Currency.rub, value: 10_000 },
      from: { currency: Currency.usd, value: 125 },
    });

    expect(result.currentValueInBase).toBe(100);
    expect(result.investedInBase).toBe(125);
    expect(result.amount).toBe(-25);
    expect(result.percent).toBeCloseTo(-20, 6);
  });
});
