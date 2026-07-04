import { AllocationTopUpType } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { CurrencyConverterFactory } from '../../asset/profit/currency-converter.factory';
import type { TopUpCalculationContext } from './top-up-calculation.context';
import { moneyInBaseToTopUp } from './money-to-quantity';
import type {
  TopUpCalculationResult,
  TopUpCalculationStrategy,
} from './top-up-calculation.strategy';

@Injectable()
export class PercentTopUpStrategy implements TopUpCalculationStrategy {
  readonly topUpType = AllocationTopUpType.percent;

  constructor(private readonly converters: CurrencyConverterFactory) {}

  calculate(context: TopUpCalculationContext): TopUpCalculationResult | null {
    const percent = Number(context.rule.value);
    const amountInBase = (context.netIncomeInBase * percent) / 100;

    return moneyInBaseToTopUp(
      amountInBase,
      context.baseCurrency,
      context.asset.currency,
      this.converters,
    );
  }
}
