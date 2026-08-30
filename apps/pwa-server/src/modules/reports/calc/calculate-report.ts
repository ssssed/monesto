import { convertToRub } from './convert-to-rub';
import { applyRules, RuleAllocationCalc } from './apply-rules';
import {
  expandExpensesToLines,
  expandIncomeToLines,
  findPrimaryIncome,
  resolveCycleForCalculation,
  scheduleDaysFromPrimary,
} from './date-window';
import { toIsoDate } from './vacation-pay';
import type {
  AssetCalc,
  DistributionRuleCalc,
  ExpenseCalc,
  IncomeSourceCalc,
  SalaryPaymentDay,
  VacationPeriodCalc,
} from './types';
import type {
  AssetSummaryDto,
  ReportExpenseLineDto,
  ReportIncomeLineDto,
} from './dto';

export type ReportErrorCode = 'NO_PRIMARY_SALARY' | 'MISSING_USD_RATE';

export class ReportCalculationError extends Error {
  constructor(
    public readonly code: ReportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReportCalculationError';
  }
}

export interface ReportResultCalc {
  cyclePaymentDay: SalaryPaymentDay;
  nominalDate: string;
  payoutDate: string;
  isPreview: boolean;
  cycleKey: string;
  incomeLines: ReportIncomeLineDto[];
  totalIncome: number;
  expenseLines: ReportExpenseLineDto[];
  totalExpenses: number;
  remainder: number;
  allocations: RuleAllocationCalc[];
  totalAllocations: number;
  freeMoney: number;
  carryInRub: number;
  assetSummary: AssetSummaryDto[];
  usdRubRate: number;
}

export const CARRYOVER_INCOME_NAME = 'Остаток с прошлого цикла';

export function calculateReport(input: {
  incomes: IncomeSourceCalc[];
  expenses: ExpenseCalc[];
  rules: DistributionRuleCalc[];
  assets: AssetCalc[];
  today: Date;
  usdRubRate?: number;
  /** Якорь цикла. По умолчанию — primaryPaymentDay. */
  cyclePaymentDay?: SalaryPaymentDay;
  /** Номинальная дата цикла (если цикл сдвинут из‑за отпуска). */
  cycleNominalDate?: Date;
  vacations?: VacationPeriodCalc[];
  carryInRub?: number;
}): ReportResultCalc {
  const primary = findPrimaryIncome(input.incomes);
  if (!primary) {
    throw new ReportCalculationError(
      'NO_PRIMARY_SALARY',
      'Не указана основная зарплата',
    );
  }

  const vacations = input.vacations ?? [];
  const scheduleDays = scheduleDaysFromPrimary(primary);
  const cyclePaymentDay =
    input.cyclePaymentDay ??
    primary.primaryPaymentDay ??
    scheduleDays[scheduleDays.length - 1] ??
    25;

  const vacationCtx =
    primary.incomeKind === 'bimonthly_salary' && vacations.length
      ? {
          vacations,
          monthlyAmount: primary.monthlyAmount ?? 0,
          tranches: primary.salaryTranches,
        }
      : undefined;

  const cycle = resolveCycleForCalculation(
    input.today,
    cyclePaymentDay,
    input.cycleNominalDate,
    scheduleDays,
    vacationCtx,
  );

  const needsUsd =
    input.rules.some(
      (rule) =>
        rule.ruleType === 'fixed' &&
        rule.currency === 'asset' &&
        rule.targetAssetId != null &&
        input.assets.find((a) => a.id === rule.targetAssetId)?.provider ===
          'usd',
    ) ||
    input.assets.some((asset) => asset.provider === 'usd') ||
    input.incomes.some((income) => income.currency === 'usd') ||
    input.expenses.some((expense) => expense.currency === 'usd');

  if (needsUsd && input.usdRubRate == null) {
    throw new ReportCalculationError(
      'MISSING_USD_RATE',
      'Курс USD/RUB ещё не загружен',
    );
  }

  const usdRubRate = input.usdRubRate ?? 82;

  const incomeLines = expandIncomeToLines(
    input.incomes,
    input.today,
    cycle.nominalDate,
    cycle.incomeStart,
    vacations,
    usdRubRate,
    { start: cycle.expenseStart, endExclusive: cycle.expenseEndExclusive },
  );
  const carryInRub = Math.max(0, Math.round(input.carryInRub ?? 0));
  if (carryInRub > 0) {
    incomeLines.unshift({
      incomeSourceId: null,
      name: CARRYOVER_INCOME_NAME,
      currency: 'rub',
      nativeAmount: carryInRub,
      amountRub: carryInRub,
      paymentDate: toIsoDate(cycle.incomeStart),
      kind: 'carryover',
    });
  }
  const expenseLines = expandExpensesToLines(
    input.expenses,
    cycle.expenseStart,
    cycle.expenseEndExclusive,
    usdRubRate,
  );

  const totalIncome = incomeLines.reduce(
    (sum, line) => sum + line.amountRub,
    0,
  );
  const totalExpenses = expenseLines.reduce(
    (sum, line) => sum + line.amountRub,
    0,
  );
  const remainder = totalIncome - totalExpenses;
  const remainderForRules = Math.max(0, remainder - carryInRub);

  const allocations = applyRules(
    remainderForRules,
    input.rules,
    input.assets,
    usdRubRate,
  );
  const totalAllocations = allocations.reduce(
    (sum, item) => sum + item.amountRub,
    0,
  );
  const freeMoney = remainder - totalAllocations;

  const incomingByAsset = new Map<number, number>();
  for (const allocation of allocations) {
    if (allocation.targetAssetId == null) continue;
    incomingByAsset.set(
      allocation.targetAssetId,
      (incomingByAsset.get(allocation.targetAssetId) ?? 0) +
        allocation.amountRub,
    );
  }

  const assetSummary: AssetSummaryDto[] = input.assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    nativeAmount: asset.currentAmount,
    rubEquivalent:
      asset.provider === 'usd'
        ? convertToRub(asset.currentAmount, 'usd', usdRubRate)
        : asset.currentAmount,
    provider: asset.provider,
    icon: asset.icon,
    bgColor: asset.bgColor,
    iconColor: asset.iconColor,
    incomingRub: incomingByAsset.get(asset.id) ?? 0,
  }));

  return {
    cyclePaymentDay: cycle.paymentDay,
    nominalDate: toIsoDate(cycle.nominalDate),
    payoutDate: toIsoDate(cycle.payoutDate),
    isPreview: cycle.isPreview,
    cycleKey: toIsoDate(cycle.nominalDate),
    incomeLines,
    totalIncome,
    expenseLines,
    totalExpenses,
    remainder,
    allocations,
    totalAllocations,
    freeMoney,
    carryInRub,
    assetSummary,
    usdRubRate,
  };
}
