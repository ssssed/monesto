import { AllocationTopUpType, TransactionType } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import type { TopUpCalculationContext } from './top-up-calculation.context';
import type {
  TopUpCalculationResult,
  TopUpCalculationStrategy,
} from './top-up-calculation.strategy';

const MIN_QUANTITY = 1e-6;

@Injectable()
export class QuantityTopUpStrategy implements TopUpCalculationStrategy {
  readonly topUpType = AllocationTopUpType.quantity;

  calculate(context: TopUpCalculationContext): TopUpCalculationResult | null {
    const quantity = Number(context.rule.value);

    if (!Number.isFinite(quantity) || quantity < MIN_QUANTITY) {
      return null;
    }

    return {
      quantity,
      pricePerUnit: 1,
      type: TransactionType.buy,
    };
  }
}
