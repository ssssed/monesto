import { startOfDay, toPayoutDate } from '../calendar/workingDays';
import { convertToRub } from '../exchange/convertToRub';
import {
  calculateSalaryPaymentAmount,
  getNextPrimaryPaymentDate,
  getNextSchedulePaymentDate,
  getSalaryWorkPeriod,
  getUpcomingBimonthlyPayments,
  normalizeSalaryTranches,
  paymentDaysFromTranches,
} from './calculateSalaryPayment';
import { listVacationPayouts } from './vacation';
import type {
  Expense,
  IncomeSource,
  ReportExpenseLine,
  ReportIncomeLine,
  SalaryPaymentDay,
  SalaryTranche,
  VacationPeriod,
} from '../types';

function formatUsdNote(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-$${abs}` : `$${abs}`;
}

function toReportAmount(
  nativeAmount: number,
  currency: IncomeSource['currency'] | Expense['currency'],
  usdRubRate: number,
): { amount: number; usdNote: string } {
  if (currency === 'usd') {
    return {
      amount: convertToRub(nativeAmount, 'usd', usdRubRate),
      usdNote: formatUsdNote(nativeAmount),
    };
  }
  return { amount: nativeAmount, usdNote: '' };
}

export interface ReportCycle {
  paymentDay: SalaryPaymentDay;
  /** Календарный якорь выплаты. */
  nominalDate: Date;
  /** Фактическая выплата (сдвиг с выходного). */
  payoutDate: Date;
  expenseEndExclusive: Date;
  incomeStart: Date;
  /** Начало периода расходов = дата этой выплаты. */
  expenseStart: Date;
  /** true, если выплата ещё не наступила. */
  isPreview: boolean;
}

export function formatReportDate(date: Date): string {
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return startOfDay(new Date(year!, month! - 1, day!));
}

function sortedPaymentDays(
  days: SalaryPaymentDay[] | undefined,
  tranches?: SalaryTranche[] | null,
): SalaryPaymentDay[] {
  if (days?.length) {
    return [...new Set(days)].sort((a, b) => a - b);
  }
  return paymentDaysFromTranches(tranches);
}

/**
 * Окно отчёта для произвольного графика выплат.
 * Для пары дней A < B логика как у классических 10/25.
 * Для одного дня — цикл от выплаты до следующей такой же через месяц.
 */
export function resolveReportWindow(
  today: Date,
  primaryPaymentDay: SalaryPaymentDay,
  scheduleDays?: SalaryPaymentDay[],
): {
  incomeDate: Date;
  expenseEndExclusive: Date;
  incomeStart: Date;
} {
  const todayStart = startOfDay(today);
  const days = sortedPaymentDays(scheduleDays);
  const primary = primaryPaymentDay;
  const day = todayStart.getDate();
  const year = todayStart.getFullYear();
  const month = todayStart.getMonth();

  let incomeDate: Date;

  if (days.length <= 1) {
    incomeDate = getNextPrimaryPaymentDate(todayStart, primary);
  } else {
    const sorted = days;
    const earlier = sorted[0]!;
    const later = sorted[sorted.length - 1]!;

    if (primary === later) {
      if (day < earlier) {
        incomeDate = startOfDay(new Date(year, month - 1, later));
      } else if (day > later) {
        incomeDate = startOfDay(new Date(year, month, later));
      } else {
        incomeDate = getNextPrimaryPaymentDate(todayStart, later);
      }
    } else if (primary === earlier) {
      if (day > earlier && day < later) {
        incomeDate = startOfDay(new Date(year, month, earlier));
      } else if (day >= later) {
        incomeDate = getNextPrimaryPaymentDate(todayStart, earlier);
      } else {
        incomeDate = getNextPrimaryPaymentDate(todayStart, earlier);
      }
    } else {
      incomeDate = getNextPrimaryPaymentDate(todayStart, primary);
    }
  }

  const expenseEndExclusive = getNextSchedulePaymentDate(incomeDate, days);
  const rawIncomeStart = todayStart <= incomeDate ? todayStart : incomeDate;
  const incomeStart = clampIncomeStart(rawIncomeStart, incomeDate, days);

  return { incomeDate, expenseEndExclusive, incomeStart };
}

/**
 * Не даём incomeStart залезть на день предыдущей выплаты по графику —
 * иначе её сумма задвоится: попадёт и в свой цикл, и в этот.
 * Актуально, когда «сегодня» само совпадает с чужой датой выплаты (напр. 25-е).
 */
export function clampIncomeStart(
  candidate: Date,
  incomeDate: Date,
  scheduleDays: SalaryPaymentDay[],
): Date {
  if (scheduleDays.length <= 1) return candidate;
  const prevScheduleDate = getPreviousSchedulePaymentDate(
    incomeDate,
    scheduleDays,
  );
  const lowerBound = startOfDay(
    new Date(
      prevScheduleDate.getFullYear(),
      prevScheduleDate.getMonth(),
      prevScheduleDate.getDate() + 1,
    ),
  );
  return candidate < lowerBound ? lowerBound : candidate;
}

/** Цикл отчёта для якоря выплаты с учётом выходных. */
export function resolveReportCycle(
  today: Date,
  paymentDay: SalaryPaymentDay,
  scheduleDays?: SalaryPaymentDay[],
): ReportCycle {
  const todayStart = startOfDay(today);
  const days = sortedPaymentDays(scheduleDays ?? [paymentDay]);
  const {
    incomeDate,
    expenseEndExclusive: nextNominalPayment,
    incomeStart,
  } = resolveReportWindow(today, paymentDay, days);
  const payoutDate = toPayoutDate(incomeDate);
  const isPreview = todayStart < payoutDate;
  const expenseStart = payoutDate;
  const expenseEndExclusive = toPayoutDate(nextNominalPayment);

  return {
    paymentDay,
    nominalDate: incomeDate,
    payoutDate,
    expenseEndExclusive,
    incomeStart,
    expenseStart,
    isPreview,
  };
}

function salaryAmountForPayment(
  paymentDate: Date,
  monthlyAmount: number,
  tranches: SalaryTranche[] | null | undefined,
  vacations: VacationPeriod[],
): number {
  const day = paymentDate.getDate();
  try {
    return calculateSalaryPaymentAmount(
      monthlyAmount,
      day,
      paymentDate,
      tranches,
      vacations,
    ).amount;
  } catch {
    return 0;
  }
}

function vacationPayOnDate(
  paymentDate: Date,
  vacations: VacationPeriod[],
  monthlyAmount: number,
  scheduleDays: SalaryPaymentDay[],
): number {
  const target = startOfDay(paymentDate).getTime();
  return listVacationPayouts(vacations, monthlyAmount, scheduleDays)
    .filter((p) => p.paymentDate.getTime() === target)
    .reduce((sum, p) => sum + p.amount, 0);
}

function isEmptyPayment(
  paymentDate: Date,
  monthlyAmount: number,
  tranches: SalaryTranche[] | null | undefined,
  vacations: VacationPeriod[],
  scheduleDays: SalaryPaymentDay[],
): boolean {
  const salary = salaryAmountForPayment(
    paymentDate,
    monthlyAmount,
    tranches,
    vacations,
  );
  const vacationPay = vacationPayOnDate(
    paymentDate,
    vacations,
    monthlyAmount,
    scheduleDays,
  );
  return salary <= 0 && vacationPay <= 0;
}

export interface VacationReportContext {
  vacations: VacationPeriod[];
  monthlyAmount: number;
  tranches?: SalaryTranche[] | null;
}

/**
 * Конец окна расходов: следующая непустая выплата.
 * Пустые циклы из‑за отпуска «поглощаются» предыдущим — расходы переезжают туда.
 */
export function resolveExpenseEndExclusive(
  nominalDate: Date,
  scheduleDays: SalaryPaymentDay[],
  vacationCtx?: VacationReportContext,
): Date {
  const days = sortedPaymentDays(scheduleDays);
  const vacations = vacationCtx?.vacations ?? [];
  const monthlyAmount = vacationCtx?.monthlyAmount ?? 0;
  const tranches = vacationCtx?.tranches;

  if (!vacations.length || monthlyAmount <= 0) {
    return toPayoutDate(getNextSchedulePaymentDate(nominalDate, days));
  }

  let cursor = startOfDay(nominalDate);
  for (let i = 0; i < 8; i += 1) {
    const next = getNextSchedulePaymentDate(cursor, days);
    if (!isEmptyPayment(next, monthlyAmount, tranches, vacations, days)) {
      return toPayoutDate(next);
    }
    cursor = next;
  }

  return toPayoutDate(getNextSchedulePaymentDate(nominalDate, days));
}

function resolveCycleForNominalDate(
  today: Date,
  nominalDate: Date,
  scheduleDays: SalaryPaymentDay[],
  vacationCtx?: VacationReportContext,
): ReportCycle {
  const todayStart = startOfDay(today);
  const days = sortedPaymentDays(scheduleDays);
  const payoutDate = toPayoutDate(nominalDate);
  const rawIncomeStart = todayStart <= nominalDate ? todayStart : nominalDate;
  const incomeStart = clampIncomeStart(rawIncomeStart, nominalDate, days);

  return {
    paymentDay: nominalDate.getDate(),
    nominalDate,
    payoutDate,
    expenseEndExclusive: resolveExpenseEndExclusive(
      nominalDate,
      days,
      vacationCtx,
    ),
    incomeStart,
    expenseStart: payoutDate,
    isPreview: todayStart < payoutDate,
  };
}

/** Предыдущий день выплаты в графике строго до beforeDate. */
function getPreviousSchedulePaymentDate(
  beforeDate: Date,
  paymentDays: SalaryPaymentDay[],
): Date {
  const days = [...new Set(paymentDays)].sort((a, b) => a - b);
  const before = startOfDay(beforeDate);
  const year = before.getFullYear();
  const month = before.getMonth();
  const day = before.getDate();

  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i]! < day) {
      return startOfDay(new Date(year, month, days[i]!));
    }
  }

  return startOfDay(new Date(year, month - 1, days[days.length - 1]!));
}

/** Ближайшая будущая непустая выплата после afterDate. */
function findNextNonEmptyPayment(
  today: Date,
  afterDate: Date,
  scheduleDays: SalaryPaymentDay[],
  vacationCtx: VacationReportContext,
): ReportCycle | null {
  const days = sortedPaymentDays(scheduleDays);
  let cursor = startOfDay(afterDate);

  for (let i = 0; i < 8; i += 1) {
    const next = getNextSchedulePaymentDate(cursor, days);
    if (
      !isEmptyPayment(
        next,
        vacationCtx.monthlyAmount,
        vacationCtx.tranches,
        vacationCtx.vacations,
        days,
      )
    ) {
      return resolveCycleForNominalDate(today, next, days, vacationCtx);
    }
    cursor = next;
  }
  return null;
}

/** Ближайшая прошедшая непустая выплата строго до beforeDate. */
function findPreviousNonEmptyPayment(
  today: Date,
  beforeDate: Date,
  scheduleDays: SalaryPaymentDay[],
  vacationCtx: VacationReportContext,
): ReportCycle | null {
  const days = sortedPaymentDays(scheduleDays);
  let cursor = startOfDay(beforeDate);

  for (let i = 0; i < 8; i += 1) {
    const prev = getPreviousSchedulePaymentDate(cursor, days);
    if (
      !isEmptyPayment(
        prev,
        vacationCtx.monthlyAmount,
        vacationCtx.tranches,
        vacationCtx.vacations,
        days,
      )
    ) {
      return resolveCycleForNominalDate(today, prev, days, vacationCtx);
    }
    cursor = prev;
  }
  return null;
}

/** Доступные циклы по дням графика, отсортированные по дате выплаты. */
export function listReportCycles(
  today: Date,
  scheduleDays?: SalaryPaymentDay[],
  vacationCtx?: VacationReportContext,
): ReportCycle[] {
  const days = sortedPaymentDays(scheduleDays);
  const vacations = vacationCtx?.vacations ?? [];
  const monthlyAmount = vacationCtx?.monthlyAmount ?? 0;
  const tranches = vacationCtx?.tranches;

  const cycles = days.map((day) => resolveReportCycle(today, day, days));

  if (!vacations.length || monthlyAmount <= 0 || !vacationCtx) {
    return cycles.sort(
      (a, b) => a.payoutDate.getTime() - b.payoutDate.getTime(),
    );
  }

  const kept: ReportCycle[] = [];
  for (const cycle of cycles) {
    if (
      isEmptyPayment(
        cycle.nominalDate,
        monthlyAmount,
        tranches,
        vacations,
        days,
      )
    ) {
      continue;
    }
    kept.push({
      ...cycle,
      expenseEndExclusive: resolveExpenseEndExclusive(
        cycle.nominalDate,
        days,
        vacationCtx,
      ),
    });
  }

  const hasPreview = kept.some((c) => c.isPreview);
  if (!hasPreview) {
    const after =
      kept.length > 0
        ? kept.reduce(
            (max, c) => (c.nominalDate > max ? c.nominalDate : max),
            kept[0]!.nominalDate,
          )
        : startOfDay(today);
    const next = findNextNonEmptyPayment(today, after, days, vacationCtx);
    if (
      next &&
      !kept.some((c) => c.nominalDate.getTime() === next.nominalDate.getTime())
    ) {
      kept.push(next);
    }
  }

  // Пустая текущая выплата (весь период в отпуске) выпадает из списка —
  // подставляем ближайший прошлый непустой цикл, иначе остаётся только план.
  const hasPast = kept.some((c) => !c.isPreview);
  if (!hasPast) {
    const before =
      kept.length > 0
        ? kept.reduce(
            (min, c) => (c.nominalDate < min ? c.nominalDate : min),
            kept[0]!.nominalDate,
          )
        : startOfDay(today);
    const prev = findPreviousNonEmptyPayment(today, before, days, vacationCtx);
    if (
      prev &&
      !kept.some((c) => c.nominalDate.getTime() === prev.nominalDate.getTime())
    ) {
      kept.push(prev);
    }
  }

  return kept.sort((a, b) => a.payoutDate.getTime() - b.payoutDate.getTime());
}

/** @deprecated используйте resolveReportWindow */
export function resolveTargetDate(
  today: Date,
  primaryPaymentDay: SalaryPaymentDay,
  scheduleDays?: SalaryPaymentDay[],
): Date {
  return resolveReportWindow(today, primaryPaymentDay, scheduleDays).incomeDate;
}

export function expandIncomeToLines(
  incomes: IncomeSource[],
  today: Date,
  targetDate: Date,
  incomeStart?: Date,
  vacations: VacationPeriod[] = [],
  usdRubRate = 82,
): ReportIncomeLine[] {
  const lines: ReportIncomeLine[] = [];
  const windowStart = startOfDay(incomeStart ?? today);
  const target = startOfDay(targetDate);

  for (const income of incomes) {
    if (income.income_kind === 'bimonthly_salary') {
      const monthlyAmount = income.monthly_amount ?? 0;
      const tranches = normalizeSalaryTranches(income.salary_tranches);
      const payments = getUpcomingBimonthlyPayments(
        windowStart,
        target,
        tranches,
      );

      for (const payment of payments) {
        const calc = calculateSalaryPaymentAmount(
          monthlyAmount,
          payment.paymentDay,
          payment.date,
          tranches,
          vacations,
        );
        if (calc.amount <= 0) continue;
        const converted = toReportAmount(
          calc.amount,
          income.currency ?? 'rub',
          usdRubRate,
        );
        lines.push({
          name: income.name,
          amount: converted.amount,
          detail: `${calc.periodLabel}, ${calc.workingDays} р.д.${converted.usdNote ? ` · ${converted.usdNote}` : ''}`,
          paymentDate: toPayoutDate(payment.date),
        });
      }

      for (const payout of listVacationPayouts(
        vacations,
        monthlyAmount,
        paymentDaysFromTranches(tranches),
      )) {
        // Сравниваем номинальную дату с окном цикла (как у зарплаты).
        if (payout.paymentDate >= windowStart && payout.paymentDate <= target) {
          const converted = toReportAmount(
            payout.amount,
            income.currency ?? 'rub',
            usdRubRate,
          );
          lines.push({
            name: 'Отпускные',
            amount: converted.amount,
            detail: `${formatReportDate(payout.start)} – ${formatReportDate(payout.end)}, ${payout.days} дн.${converted.usdNote ? ` · ${converted.usdNote}` : ''}`,
            paymentDate: toPayoutDate(payout.paymentDate),
          });
        }
      }
      continue;
    }

    if (income.is_one_time || income.recurrence === 'one_time') {
      if (!income.specific_date) continue;
      const date = parseDate(income.specific_date);
      if (date >= windowStart && date <= target) {
        const converted = toReportAmount(
          income.amount ?? 0,
          income.currency ?? 'rub',
          usdRubRate,
        );
        lines.push({
          name: income.name,
          amount: converted.amount,
          detail: converted.usdNote || undefined,
          paymentDate: date,
        });
      }
      continue;
    }

    if (income.payment_day == null) continue;

    const cursor = startOfDay(
      new Date(windowStart.getFullYear(), windowStart.getMonth(), 1),
    );
    while (cursor <= target) {
      const paymentDate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), income.payment_day),
      );
      if (paymentDate >= windowStart && paymentDate <= target) {
        const converted = toReportAmount(
          income.amount ?? 0,
          income.currency ?? 'rub',
          usdRubRate,
        );
        lines.push({
          name: income.name,
          amount: converted.amount,
          detail: converted.usdNote
            ? `${income.payment_day}-е · ${converted.usdNote}`
            : `${income.payment_day}-е число`,
          paymentDate,
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return lines.sort(
    (a, b) => a.paymentDate.getTime() - b.paymentDate.getTime(),
  );
}

/**
 * Расходы в [expenseStart, expenseEndExclusive).
 */
export function expandExpensesToLines(
  expenses: Expense[],
  expenseStart: Date,
  expenseEndExclusive: Date,
  usdRubRate = 82,
): ReportExpenseLine[] {
  const lines: ReportExpenseLine[] = [];
  const rangeStart = startOfDay(expenseStart);
  const endExclusive = startOfDay(expenseEndExclusive);

  for (const expense of expenses) {
    if (expense.recurrence === 'one_time') {
      if (!expense.specific_date) continue;
      const date = parseDate(expense.specific_date);
      if (date >= rangeStart && date < endExclusive) {
        const converted = toReportAmount(
          expense.amount,
          expense.currency ?? 'rub',
          usdRubRate,
        );
        lines.push({
          name: expense.name,
          amount: converted.amount,
          detail: converted.usdNote
            ? `${expense.specific_date} · ${converted.usdNote}`
            : expense.specific_date,
        });
      }
      continue;
    }

    if (expense.due_day == null) continue;

    const cursor = startOfDay(
      new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1),
    );
    const lastMonth = startOfDay(
      new Date(endExclusive.getFullYear(), endExclusive.getMonth(), 1),
    );

    while (cursor <= lastMonth) {
      const dueDate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), expense.due_day),
      );
      if (dueDate >= rangeStart && dueDate < endExclusive) {
        const converted = toReportAmount(
          expense.amount,
          expense.currency ?? 'rub',
          usdRubRate,
        );
        lines.push({
          name: expense.name,
          amount: converted.amount,
          detail: converted.usdNote
            ? `${expense.due_day}-е · ${converted.usdNote}`
            : `${expense.due_day}-е число`,
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return lines;
}

export function findPrimaryIncome(
  incomes: IncomeSource[],
): IncomeSource | undefined {
  return incomes.find((income) => income.is_primary);
}

export function scheduleDaysFromPrimary(
  primary: IncomeSource | undefined,
): SalaryPaymentDay[] {
  if (!primary) return paymentDaysFromTranches(null);
  if (primary.income_kind === 'bimonthly_salary') {
    return paymentDaysFromTranches(primary.salary_tranches);
  }
  if (primary.payment_day != null) return [primary.payment_day];
  if (primary.primary_payment_day != null) return [primary.primary_payment_day];
  return paymentDaysFromTranches(null);
}

export { getSalaryWorkPeriod };
