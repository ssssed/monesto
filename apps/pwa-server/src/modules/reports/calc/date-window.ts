import { startOfDay, toPayoutDate } from './working-days';
import { convertToRub } from './convert-to-rub';
import {
  calculateSalaryPaymentAmount,
  getNextPrimaryPaymentDate,
  getNextSchedulePaymentDate,
  getUpcomingBimonthlyPayments,
  normalizeSalaryTranches,
  paymentDaysFromTranches,
} from './salary-schedule';
import { listVacationPayouts, toIsoDate } from './vacation-pay';
import type {
  ExpenseCalc,
  IncomeSourceCalc,
  SalaryPaymentDay,
  SalaryTranche,
  VacationPeriodCalc,
} from './types';
import type { ReportExpenseLineDto, ReportIncomeLineDto } from './dto';

function toReportAmounts(
  nativeAmount: number,
  currency: 'rub' | 'usd',
  usdRubRate: number,
): { nativeAmount: number; amountRub: number } {
  return {
    nativeAmount,
    amountRub:
      currency === 'usd'
        ? convertToRub(nativeAmount, 'usd', usdRubRate)
        : nativeAmount,
  };
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

export function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return startOfDay(new Date(year, month - 1, day));
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
    const earlier = sorted[0];
    const later = sorted[sorted.length - 1];

    if (primary === later) {
      if (day < earlier) {
        incomeDate = startOfDay(new Date(year, month - 1, later));
      } else if (day > later) {
        incomeDate = startOfDay(new Date(year, month, later));
      } else {
        incomeDate = getNextPrimaryPaymentDate(todayStart, later);
      }
    } else if (primary === earlier) {
      incomeDate = getNextPrimaryPaymentDate(todayStart, earlier);
      if (day > earlier && day < later) {
        incomeDate = startOfDay(new Date(year, month, earlier));
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
  vacations: VacationPeriodCalc[],
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
  vacations: VacationPeriodCalc[],
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
  vacations: VacationPeriodCalc[],
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
  vacations: VacationPeriodCalc[];
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
    if (days[i] < day) {
      return startOfDay(new Date(year, month, days[i]));
    }
  }

  return startOfDay(new Date(year, month - 1, days[days.length - 1]));
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

export function findPreviousReportCycle(
  today: Date,
  beforeNominalDate: Date,
  scheduleDays?: SalaryPaymentDay[],
  vacationCtx?: VacationReportContext,
): ReportCycle | null {
  const days = sortedPaymentDays(scheduleDays);
  if (!vacationCtx?.vacations.length || (vacationCtx.monthlyAmount ?? 0) <= 0) {
    const prev = getPreviousSchedulePaymentDate(beforeNominalDate, days);
    return resolveCycleForNominalDate(today, prev, days, vacationCtx);
  }
  return findPreviousNonEmptyPayment(
    today,
    beforeNominalDate,
    days,
    vacationCtx,
  );
}

/** Цикл для расчёта отчёта: якорь по умолчанию либо явная номинальная дата. */
export function resolveCycleForCalculation(
  today: Date,
  cyclePaymentDay: SalaryPaymentDay,
  cycleNominalDate: Date | undefined,
  scheduleDays: SalaryPaymentDay[],
  vacationCtx?: VacationReportContext,
): ReportCycle {
  const cycle = resolveReportCycle(today, cyclePaymentDay, scheduleDays);
  if (
    cycleNominalDate &&
    cycleNominalDate.getTime() !== cycle.nominalDate.getTime()
  ) {
    return resolveCycleForNominalDate(
      today,
      startOfDay(cycleNominalDate),
      scheduleDays,
      vacationCtx,
    );
  }
  if (vacationCtx) {
    return {
      ...cycle,
      expenseEndExclusive: resolveExpenseEndExclusive(
        cycle.nominalDate,
        scheduleDays,
        vacationCtx,
      ),
    };
  }
  return cycle;
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
            kept[0].nominalDate,
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

  const hasPast = kept.some((c) => !c.isPreview);
  if (!hasPast) {
    const before =
      kept.length > 0
        ? kept.reduce(
            (min, c) => (c.nominalDate < min ? c.nominalDate : min),
            kept[0].nominalDate,
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

export function expandIncomeToLines(
  incomes: IncomeSourceCalc[],
  today: Date,
  targetDate: Date,
  incomeStart: Date | undefined,
  vacations: VacationPeriodCalc[],
  usdRubRate: number,
  oneTimeRange?: { start: Date; endExclusive: Date },
): ReportIncomeLineDto[] {
  const lines: ReportIncomeLineDto[] = [];
  const windowStart = startOfDay(incomeStart ?? today);
  const target = startOfDay(targetDate);
  const oneTimeStart = oneTimeRange
    ? startOfDay(oneTimeRange.start)
    : windowStart;
  const oneTimeEndExclusive = oneTimeRange
    ? startOfDay(oneTimeRange.endExclusive)
    : null;

  for (const income of incomes) {
    const currency = income.currency === 'usd' ? 'usd' : 'rub';

    if (income.incomeKind === 'bimonthly_salary') {
      const monthlyAmount = income.monthlyAmount ?? 0;
      const tranches = normalizeSalaryTranches(income.salaryTranches);
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
        const converted = toReportAmounts(calc.amount, currency, usdRubRate);
        lines.push({
          incomeSourceId: income.id,
          name: income.name,
          currency: income.currency,
          nativeAmount: converted.nativeAmount,
          amountRub: converted.amountRub,
          paymentDate: toIsoDate(toPayoutDate(payment.date)),
          kind: 'bimonthly_salary',
          periodFrom: toIsoDate(calc.periodFrom),
          periodTo: toIsoDate(calc.periodTo),
          workingDays: calc.workingDays,
          totalMonthWorkingDays: calc.totalMonthWorkingDays,
        });
      }

      for (const payout of listVacationPayouts(
        vacations,
        monthlyAmount,
        paymentDaysFromTranches(tranches),
      )) {
        if (payout.paymentDate >= windowStart && payout.paymentDate <= target) {
          const converted = toReportAmounts(
            payout.amount,
            currency,
            usdRubRate,
          );
          lines.push({
            incomeSourceId: income.id,
            name: 'Отпускные',
            currency: income.currency,
            nativeAmount: converted.nativeAmount,
            amountRub: converted.amountRub,
            paymentDate: toIsoDate(toPayoutDate(payout.paymentDate)),
            kind: 'vacation_payout',
            vacationId: payout.vacationId,
            vacationStart: toIsoDate(payout.start),
            vacationEnd: toIsoDate(payout.end),
            vacationDays: payout.days,
          });
        }
      }
      continue;
    }

    if (income.isOneTime || income.recurrence === 'one_time') {
      if (!income.specificDate) continue;
      const date = parseDate(income.specificDate);
      const inRange = oneTimeEndExclusive
        ? date >= oneTimeStart && date < oneTimeEndExclusive
        : date >= windowStart && date <= target;
      if (inRange) {
        const converted = toReportAmounts(
          income.amount ?? 0,
          currency,
          usdRubRate,
        );
        lines.push({
          incomeSourceId: income.id,
          name: income.name,
          currency: income.currency,
          nativeAmount: converted.nativeAmount,
          amountRub: converted.amountRub,
          paymentDate: toIsoDate(date),
          kind: 'one_time',
        });
      }
      continue;
    }

    if (income.paymentDay == null) continue;

    const cursor = startOfDay(
      new Date(windowStart.getFullYear(), windowStart.getMonth(), 1),
    );
    while (cursor <= target) {
      const paymentDate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), income.paymentDay),
      );
      if (paymentDate >= windowStart && paymentDate <= target) {
        const converted = toReportAmounts(
          income.amount ?? 0,
          currency,
          usdRubRate,
        );
        lines.push({
          incomeSourceId: income.id,
          name: income.name,
          currency: income.currency,
          nativeAmount: converted.nativeAmount,
          amountRub: converted.amountRub,
          paymentDate: toIsoDate(paymentDate),
          kind: 'fixed_day',
          paymentDay: income.paymentDay,
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return lines.sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
}

/** Расходы в [expenseStart, expenseEndExclusive). */
export function expandExpensesToLines(
  expenses: ExpenseCalc[],
  expenseStart: Date,
  expenseEndExclusive: Date,
  usdRubRate: number,
): ReportExpenseLineDto[] {
  const lines: ReportExpenseLineDto[] = [];
  const rangeStart = startOfDay(expenseStart);
  const endExclusive = startOfDay(expenseEndExclusive);

  for (const expense of expenses) {
    const currency = expense.currency === 'usd' ? 'usd' : 'rub';

    if (expense.recurrence === 'one_time') {
      if (!expense.specificDate) continue;
      const date = parseDate(expense.specificDate);
      if (date >= rangeStart && date < endExclusive) {
        const converted = toReportAmounts(expense.amount, currency, usdRubRate);
        lines.push({
          expenseId: expense.id,
          name: expense.name,
          currency: expense.currency,
          nativeAmount: converted.nativeAmount,
          amountRub: converted.amountRub,
          kind: 'one_time',
          dueDate: expense.specificDate,
        });
      }
      continue;
    }

    if (expense.dueDay == null) continue;

    const cursor = startOfDay(
      new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1),
    );
    const lastMonth = startOfDay(
      new Date(endExclusive.getFullYear(), endExclusive.getMonth(), 1),
    );

    while (cursor <= lastMonth) {
      const dueDate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), expense.dueDay),
      );
      if (dueDate >= rangeStart && dueDate < endExclusive) {
        const converted = toReportAmounts(expense.amount, currency, usdRubRate);
        lines.push({
          expenseId: expense.id,
          name: expense.name,
          currency: expense.currency,
          nativeAmount: converted.nativeAmount,
          amountRub: converted.amountRub,
          kind: 'recurring',
          dueDate: toIsoDate(dueDate),
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return lines;
}

export function findPrimaryIncome(
  incomes: IncomeSourceCalc[],
): IncomeSourceCalc | undefined {
  return incomes.find((income) => income.isPrimary);
}

export function scheduleDaysFromPrimary(
  primary: IncomeSourceCalc | undefined,
): SalaryPaymentDay[] {
  if (!primary) return paymentDaysFromTranches(null);
  if (primary.incomeKind === 'bimonthly_salary') {
    return paymentDaysFromTranches(primary.salaryTranches);
  }
  if (primary.paymentDay != null) return [primary.paymentDay];
  if (primary.primaryPaymentDay != null) return [primary.primaryPaymentDay];
  return paymentDaysFromTranches(null);
}
