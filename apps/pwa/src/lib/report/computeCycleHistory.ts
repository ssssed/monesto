import { startOfDay } from '../calendar/workingDays';
import { calculateReport, isReportError } from './calculateReport';
import {
  findPreviousReportCycle,
  findPrimaryIncome,
  formatReportDate,
  listReportCycles,
  scheduleDaysFromPrimary,
  type ReportCycle,
} from './dateWindow';
import type {
  Asset,
  DistributionRule,
  Expense,
  IncomeSource,
  VacationPeriod,
} from '../types';

export interface CycleHistoryPoint {
  cycleKey: string;
  label: string;
  payoutDate: Date;
  totalIncome: number;
  totalExpenses: number;
  remainder: number;
}

/** Прошлые циклы (без плана) за monthsBack месяцев, доход/расход по каждому. */
export function computeCycleHistory(input: {
  incomes: IncomeSource[];
  expenses: Expense[];
  rules: DistributionRule[];
  assets: Asset[];
  vacations?: VacationPeriod[];
  today: Date;
  usdRubRate?: number;
  monthsBack?: number;
  /** Не показывать циклы раньше начала учёта — не придумываем историю до него. */
  trackingStartedAt?: Date | null;
}): CycleHistoryPoint[] {
  const primary = findPrimaryIncome(input.incomes);
  if (!primary) return [];

  const vacations = input.vacations ?? [];
  const scheduleDays = scheduleDaysFromPrimary(primary);
  const vacationCtx =
    primary.income_kind === 'bimonthly_salary' && vacations.length
      ? {
          vacations,
          monthlyAmount: primary.monthly_amount ?? 0,
          tranches: primary.salary_tranches,
        }
      : undefined;

  const cycles = listReportCycles(input.today, scheduleDays, vacationCtx);
  let cursor: ReportCycle | null = cycles.find((c) => !c.isPreview) ?? cycles[0] ?? null;
  // Якорь не должен быть будущим планом — историю считаем только по уже наступившим циклам.
  if (cursor?.isPreview) {
    cursor = findPreviousReportCycle(
      input.today,
      cursor.nominalDate,
      scheduleDays,
      vacationCtx,
    );
  }
  if (!cursor) return [];

  const monthsBack = input.monthsBack ?? 6;
  const cutoff = new Date(input.today);
  cutoff.setMonth(cutoff.getMonth() - monthsBack);

  const trackingStart = input.trackingStartedAt
    ? startOfDay(input.trackingStartedAt)
    : null;
  const effectiveCutoff = trackingStart && trackingStart > cutoff ? trackingStart : cutoff;

  const chain: ReportCycle[] = [];
  let safety = 0;
  while (cursor && cursor.nominalDate >= effectiveCutoff && safety < 40) {
    chain.push(cursor);
    cursor = findPreviousReportCycle(
      input.today,
      cursor.nominalDate,
      scheduleDays,
      vacationCtx,
    );
    safety += 1;
  }

  const points: CycleHistoryPoint[] = [];
  for (const cycle of chain) {
    const report = calculateReport({
      incomes: input.incomes,
      expenses: input.expenses,
      rules: input.rules,
      assets: input.assets,
      vacations,
      today: input.today,
      cyclePaymentDay: cycle.paymentDay,
      cycleNominalDate: cycle.nominalDate,
      usdRubRate: input.usdRubRate,
      carryInRub: 0,
    });
    if (isReportError(report)) continue;
    points.push({
      cycleKey: report.cycleKey,
      label: formatReportDate(cycle.payoutDate),
      payoutDate: cycle.payoutDate,
      totalIncome: report.totalIncome,
      totalExpenses: report.totalExpenses,
      remainder: report.remainder,
    });
  }

  return points.reverse(); // от старых к новым
}
