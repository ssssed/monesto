import { AllocationTopUpType } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { FixedAmountTopUpStrategy } from './fixed-amount-top-up.strategy';
import { PercentTopUpStrategy } from './percent-top-up.strategy';
import { QuantityTopUpStrategy } from './quantity-top-up.strategy';
import type { TopUpCalculationStrategy } from './top-up-calculation.strategy';

@Injectable()
export class TopUpCalculationFactory {
  private readonly byType: Map<AllocationTopUpType, TopUpCalculationStrategy>;

  constructor(
    percent: PercentTopUpStrategy,
    fixedAmount: FixedAmountTopUpStrategy,
    quantity: QuantityTopUpStrategy,
  ) {
    this.byType = new Map<AllocationTopUpType, TopUpCalculationStrategy>();
    this.byType.set(AllocationTopUpType.percent, percent);
    this.byType.set(AllocationTopUpType.fixed_amount, fixedAmount);
    this.byType.set(AllocationTopUpType.quantity, quantity);
  }

  getStrategy(topUpType: AllocationTopUpType): TopUpCalculationStrategy {
    const strategy = this.byType.get(topUpType);
    if (!strategy) {
      throw new Error(`No top-up calculation strategy for ${topUpType}`);
    }
    return strategy;
  }
}
