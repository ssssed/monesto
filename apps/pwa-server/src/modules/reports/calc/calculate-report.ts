import { startOfDay, toPayoutDate } from './working-days';
import { convertToRub } from './convert-to-rub';
import { applyRules, RuleAllocationCalc } from './apply-rules';
import {
  clampIncomeStart,
  expandExpensesToLines,
  expandIncomeToLines,
  findPrimaryIncome,
  resolveExpenseEndExclusive,
  resolveReportCycle,
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
  assetSummary: AssetSummaryDto[];
  usdRubRate: number;
}

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

  let cycle = resolveReportCycle(input.today, cyclePaymentDay, scheduleDays);
  if (
    input.cycleNominalDate &&
    input.cycleNominalDate.getTime() !== cycle.nominalDate.getTime()
  ) {
    const todayStart = startOfDay(input.today);
    const nominalDate = startOfDay(input.cycleNominalDate);
    const payoutDate = toPayoutDate(nominalDate);
    const rawIncomeStart = todayStart <= nominalDate ? todayStart : nominalDate;
    const incomeStart = clampIncomeStart(
      rawIncomeStart,
      nominalDate,
      scheduleDays,
    );
    cycle = {
      paymentDay: nominalDate.getDate(),
      nominalDate,
      payoutDate,
      expenseEndExclusive: resolveExpenseEndExclusive(
        nominalDate,
        scheduleDays,
        vacationCtx,
      ),
      incomeStart,
      expenseStart: payoutDate,
      isPreview: todayStart < payoutDate,
    };
  } else if (vacationCtx) {
    cycle = {
      ...cycle,
      expenseEndExclusive: resolveExpenseEndExclusive(
        cycle.nominalDate,
        scheduleDays,
        vacationCtx,
      ),
    };
  }

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
  );
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

  const allocations = applyRules(
    remainder,
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
    assetSummary,
    usdRubRate,
  };
}
