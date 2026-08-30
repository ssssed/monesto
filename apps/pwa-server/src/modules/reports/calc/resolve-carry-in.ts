import { startOfDay } from './working-days';
import { calculateReport, ReportCalculationError } from './calculate-report';
import {
  findPreviousReportCycle,
  type ReportCycle,
  type VacationReportContext,
} from './date-window';
import type {
  AssetCalc,
  DistributionRuleCalc,
  ExpenseCalc,
  IncomeSourceCalc,
  SalaryPaymentDay,
  VacationPeriodCalc,
} from './types';

export interface CarryInResult {
  suggestedRub: number;
  amountRub: number;
  isOverride: boolean;
  hasPreviousCycle: boolean;
}

function freeMoneyAfterRejections(
  remainder: number,
  allocations: { ruleId: number; amountRub: number }[],
  rejectedIds: number[],
): number {
  const allocated = allocations
    .filter((item) => !rejectedIds.includes(item.ruleId))
    .reduce((sum, item) => sum + item.amountRub, 0);
  return Math.max(0, remainder - allocated);
}

function isBeforeTracking(cycle: ReportCycle, trackingStartedAt: Date | null) {
  if (!trackingStartedAt) return true;
  return startOfDay(cycle.nominalDate) < startOfDay(trackingStartedAt);
}

export function resolveCarryIn(input: {
  today: Date;
  cycle: ReportCycle;
  scheduleDays: SalaryPaymentDay[];
  vacationCtx?: VacationReportContext;
  incomes: IncomeSourceCalc[];
  expenses: ExpenseCalc[];
  rules: DistributionRuleCalc[];
  assets: AssetCalc[];
  vacations: VacationPeriodCalc[];
  usdRubRate: number;
  getOverride: (cycleKey: string) => number | null;
  getRejectedIds: (cycleKey: string) => number[];
  trackingStartedAt?: Date | null;
  depth?: number;
}): CarryInResult {
  const cycleKey = toCycleKey(input.cycle.nominalDate);
  const override = input.getOverride(cycleKey);
  const trackingStartedAt = input.trackingStartedAt ?? null;
  const prev = findPreviousReportCycle(
    input.today,
    input.cycle.nominalDate,
    input.scheduleDays,
    input.vacationCtx,
  );

  if (!prev || isBeforeTracking(prev, trackingStartedAt)) {
    const amountRub = override != null ? Math.max(0, Math.round(override)) : 0;
    return {
      suggestedRub: 0,
      amountRub,
      isOverride: override != null,
      hasPreviousCycle: override != null,
    };
  }

  const depth = input.depth ?? 0;
  let suggestedRub = 0;
  if (depth < 24) {
    const prevCarry = resolveCarryIn({
      ...input,
      cycle: prev,
      depth: depth + 1,
    });
    try {
      const prevReport = calculateReport({
        incomes: input.incomes,
        expenses: input.expenses,
        rules: input.rules,
        assets: input.assets,
        vacations: input.vacations,
        today: input.today,
        cyclePaymentDay: prev.paymentDay,
        cycleNominalDate: prev.nominalDate,
        usdRubRate: input.usdRubRate,
        carryInRub: prevCarry.amountRub,
      });
      suggestedRub = freeMoneyAfterRejections(
        prevReport.remainder,
        prevReport.allocations,
        input.getRejectedIds(prevReport.cycleKey),
      );
    } catch (error) {
      if (!(error instanceof ReportCalculationError)) throw error;
    }
  }

  const amountRub =
    override != null ? Math.max(0, Math.round(override)) : suggestedRub;

  return {
    suggestedRub,
    amountRub,
    isOverride: override != null,
    hasPreviousCycle: true,
  };
}

function toCycleKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
