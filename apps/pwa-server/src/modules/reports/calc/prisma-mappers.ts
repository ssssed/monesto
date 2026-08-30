import type {
  Asset,
  AssetTransaction,
  DistributionRule,
  Expense,
  IncomeSource,
  VacationPeriod,
} from '@prisma/client';
import { prismaDateOnlyToIso } from './date-only';
import type {
  AssetCalc,
  AssetTransactionCalc,
  DistributionRuleCalc,
  ExpenseCalc,
  IncomeSourceCalc,
  SalaryTranche,
  VacationPeriodCalc,
} from './types';

function toNumber(value: unknown): number {
  return Number(value);
}

function toNumberOrNull(value: unknown): number | null {
  return value == null ? null : Number(value);
}

export function mapIncomeSource(row: IncomeSource): IncomeSourceCalc {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    incomeKind: row.incomeKind,
    amount: toNumberOrNull(row.amount),
    monthlyAmount: toNumberOrNull(row.monthlyAmount),
    isOneTime: row.isOneTime,
    recurrence: row.recurrence,
    paymentDay: row.paymentDay,
    isPrimary: row.isPrimary,
    primaryPaymentDay: row.primaryPaymentDay,
    specificDate: row.specificDate
      ? prismaDateOnlyToIso(row.specificDate)
      : null,
    salaryTranches:
      (row.salaryTranches as unknown as SalaryTranche[] | null) ?? null,
  };
}

export function mapExpense(row: Expense): ExpenseCalc {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    amount: toNumber(row.amount),
    recurrence: row.recurrence,
    dueDay: row.dueDay,
    specificDate: row.specificDate
      ? prismaDateOnlyToIso(row.specificDate)
      : null,
    linkedAssetId: row.linkedAssetId,
  };
}

export function mapAsset(row: Asset): AssetCalc {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    goalAmount: toNumberOrNull(row.goalAmount),
    currentAmount: toNumber(row.currentAmount),
    icon: row.icon,
    bgColor: row.bgColor,
    iconColor: row.iconColor,
    costBasisRub: toNumber(row.costBasisRub),
    linkedExpenseId: row.linkedExpenseId,
    creditAnnualRate: toNumberOrNull(row.creditAnnualRate),
    creditTermMonths: row.creditTermMonths,
    creditStartDate: row.creditStartDate
      ? prismaDateOnlyToIso(row.creditStartDate)
      : null,
    creditRemainingMonths: row.creditRemainingMonths,
    creditEarlyRepayMode: row.creditEarlyRepayMode,
  };
}

export function mapDistributionRule(
  row: DistributionRule,
): DistributionRuleCalc {
  return {
    id: row.id,
    name: row.name,
    ruleType: row.ruleType,
    value: toNumber(row.value),
    currency: row.currency,
    targetAssetId: row.targetAssetId,
    sortOrder: row.sortOrder,
    creditEarlyRepayMode: row.creditEarlyRepayMode,
  };
}

export function mapVacationPeriod(row: VacationPeriod): VacationPeriodCalc {
  return {
    id: row.id,
    startDate: prismaDateOnlyToIso(row.startDate),
    endDate: prismaDateOnlyToIso(row.endDate),
  };
}

export function mapAssetTransaction(
  row: AssetTransaction,
): AssetTransactionCalc {
  return {
    assetId: row.assetId,
    amountDelta: toNumber(row.amountDelta),
    createdAt: row.createdAt,
  };
}
