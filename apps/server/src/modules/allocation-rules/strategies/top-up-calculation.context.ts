import type { AllocationRule, Asset, Currency } from '@prisma/client';

export interface TopUpCalculationContext {
  rule: AllocationRule;
  asset: Asset;
  baseCurrency: Currency;
  /** Чистый доход (доход − обязательные расходы) за текущий месяц в базовой валюте. */
  netIncomeInBase: number;
}
