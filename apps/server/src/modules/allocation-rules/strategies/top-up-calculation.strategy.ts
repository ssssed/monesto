import { AllocationTopUpType, TransactionType } from '@prisma/client';
import type { TopUpCalculationContext } from './top-up-calculation.context';

export interface TopUpCalculationResult {
  quantity: number;
  pricePerUnit: number;
  type: TransactionType;
}

export interface TopUpCalculationStrategy {
  readonly topUpType: AllocationTopUpType;

  calculate(
    context: TopUpCalculationContext,
  ): TopUpCalculationResult | null;
}
