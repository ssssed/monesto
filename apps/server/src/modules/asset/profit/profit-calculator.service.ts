import { Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { CurrencyConverterFactory } from './currency-converter.factory';

export interface MoneyAmount {
  currency: Currency;
  value: number;
}

export interface ProfitCompareInput {
  /** Обычно текущая стоимость (в валюте актива до конвертации). */
  to: MoneyAmount;
  /** Обычно вложено (уже в базовой валюте пользователя). */
  from: MoneyAmount;
  /** Валюта, в которой считаем профит (базовая валюта пользователя). */
  baseCurrency: Currency;
}

export interface ProfitCompareResult {
  currentValueInBase: number;
  investedInBase: number;
  amount: number;
  percent: number;
}

@Injectable()
export class ProfitCalculatorService {
  constructor(private readonly converters: CurrencyConverterFactory) {}

  calculate(input: ProfitCompareInput): ProfitCompareResult {
    const { baseCurrency } = input;

    const currentValueInBase = this.converters.convert(
      input.to.value,
      input.to.currency,
      baseCurrency,
    );
    const investedInBase = this.converters.convert(
      input.from.value,
      input.from.currency,
      baseCurrency,
    );

    console.log('[ProfitCalculator]', {
      to: { value: input.to.value, currency: input.to.currency },
      from: { value: input.from.value, currency: input.from.currency },
      baseCurrency,
      currentValueInBase,
      investedInBase,
    });

    const amount = currentValueInBase - investedInBase;
    const percent = investedInBase === 0 ? 0 : (amount / investedInBase) * 100;

    return {
      currentValueInBase,
      investedInBase,
      amount,
      percent,
    };
  }
}
