import {
  AssetProvider,
  CreditEarlyRepayMode,
  IncomeKind,
  MoneyFlowCurrency,
  Recurrence,
  RuleCurrency,
  RuleType,
} from '@prisma/client';

/**
 * Plain-number/ISO-date shapes the calc layer works with — Prisma's Decimal
 * and Date objects are converted to number/ISO-string at the service
 * boundary (see date-only.ts for why dates need special handling).
 */

export interface SalaryTranche {
  paymentDay: number;
  periodFromDay: number;
  periodToDay: number;
  periodMonthOffset: 0 | -1;
}

export interface IncomeSourceCalc {
  id: number;
  name: string;
  currency: MoneyFlowCurrency;
  incomeKind: IncomeKind;
  amount: number | null;
  monthlyAmount: number | null;
  isOneTime: boolean;
  recurrence: Recurrence;
  paymentDay: number | null;
  isPrimary: boolean;
  primaryPaymentDay: number | null;
  specificDate: string | null;
  salaryTranches: SalaryTranche[] | null;
}

export interface ExpenseCalc {
  id: number;
  name: string;
  currency: MoneyFlowCurrency;
  amount: number;
  recurrence: Recurrence;
  dueDay: number | null;
  specificDate: string | null;
  linkedAssetId: number | null;
}

export interface AssetCalc {
  id: number;
  name: string;
  provider: AssetProvider;
  goalAmount: number | null;
  currentAmount: number;
  icon: string;
  bgColor: string;
  iconColor: string;
  costBasisRub: number;
  linkedExpenseId: number | null;
  creditAnnualRate: number | null;
  creditTermMonths: number | null;
  creditStartDate: string | null;
  creditRemainingMonths: number | null;
  creditEarlyRepayMode: CreditEarlyRepayMode | null;
}

export interface DistributionRuleCalc {
  id: number;
  name: string;
  ruleType: RuleType;
  value: number;
  currency: RuleCurrency;
  targetAssetId: number | null;
  sortOrder: number;
  creditEarlyRepayMode: CreditEarlyRepayMode | null;
}

export interface VacationPeriodCalc {
  id: number;
  startDate: string;
  endDate: string;
}

export interface AssetTransactionCalc {
  assetId: number;
  amountDelta: number;
  createdAt: Date;
}

export type SalaryPaymentDay = number;
