import {
  countWorkingDays,
  countWorkingDaysInMonth,
  endOfMonth,
  startOfDay,
} from '../calendar/workingDays';
import type { SalaryPaymentDay, SalaryTranche } from '../types';

const MONTH_NAMES = [
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

/** Классический график: 10-е за 16–конец прошлого, 25-е за 1–15 текущего. */
export const DEFAULT_BIMONTHLY_TRANCHES: SalaryTranche[] = [
  {
    paymentDay: 10,
    periodFromDay: 16,
    periodToDay: 31,
    periodMonthOffset: -1,
  },
  {
    paymentDay: 25,
    periodFromDay: 1,
    periodToDay: 15,
    periodMonthOffset: 0,
  },
];

/** Альтернативный график: 5-е за 16–конец прошлого, 20-е за 1–15 текущего. */
export const PRESET_5_20_TRANCHES: SalaryTranche[] = [
  {
    paymentDay: 5,
    periodFromDay: 16,
    periodToDay: 31,
    periodMonthOffset: -1,
  },
  {
    paymentDay: 20,
    periodFromDay: 1,
    periodToDay: 15,
    periodMonthOffset: 0,
  },
];

export type SalarySchedulePresetId = '10-25' | '5-20' | 'custom';

export function detectSalarySchedulePreset(
  tranches: SalaryTranche[] | null | undefined,
): SalarySchedulePresetId {
  if (!tranches?.length) return 'custom';
  const normalized = [...normalizeSalaryTranches(tranches)].sort(
    (a, b) => a.paymentDay - b.paymentDay,
  );
  if (tranchesMatch(normalized, sortedTranches(DEFAULT_BIMONTHLY_TRANCHES))) {
    return '10-25';
  }
  if (tranchesMatch(normalized, sortedTranches(PRESET_5_20_TRANCHES))) {
    return '5-20';
  }
  return 'custom';
}

function sortedTranches(tranches: SalaryTranche[]): SalaryTranche[] {
  return [...tranches].sort((a, b) => a.paymentDay - b.paymentDay);
}

function tranchesMatch(a: SalaryTranche[], b: SalaryTranche[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((tranche, i) => {
    const other = b[i];
    if (!other) return false;
    return (
      tranche.paymentDay === other.paymentDay &&
      tranche.periodFromDay === other.periodFromDay &&
      tranche.periodToDay === other.periodToDay &&
      tranche.periodMonthOffset === other.periodMonthOffset
    );
  });
}

export function tranchesFromPreset(
  id: Exclude<SalarySchedulePresetId, 'custom'>,
): SalaryTranche[] {
  const source =
    id === '5-20' ? PRESET_5_20_TRANCHES : DEFAULT_BIMONTHLY_TRANCHES;
  return source.map((t) => ({ ...t }));
}

export function normalizeSalaryTranches(
  tranches: SalaryTranche[] | null | undefined,
): SalaryTranche[] {
  if (!tranches?.length) return DEFAULT_BIMONTHLY_TRANCHES.map((t) => ({ ...t }));
  return tranches.map((t) => ({
    paymentDay: clampDay(t.paymentDay),
    periodFromDay: clampDay(t.periodFromDay),
    periodToDay: clampDay(t.periodToDay),
    periodMonthOffset: t.periodMonthOffset === -1 ? -1 : 0,
  }));
}

function clampDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(31, Math.max(1, Math.round(day)));
}

export function paymentDaysFromTranches(
  tranches: SalaryTranche[] | null | undefined,
): SalaryPaymentDay[] {
  const days = normalizeSalaryTranches(tranches).map((t) => t.paymentDay);
  return [...new Set(days)].sort((a, b) => a - b);
}

function formatPeriodLabel(from: Date, to: Date): string {
  const fromDay = from.getDate();
  const toDay = to.getDate();
  const fromMonth = MONTH_NAMES[from.getMonth()];
  const toMonth = MONTH_NAMES[to.getMonth()];

  if (from.getMonth() === to.getMonth()) {
    return `${fromDay}–${toDay} ${fromMonth}`;
  }
  return `${fromDay} ${fromMonth} – ${toDay} ${toMonth}`;
}

function shiftMonth(
  year: number,
  month: number,
  offset: number,
): { year: number; month: number } {
  const date = new Date(year, month + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function resolveTranchePeriodBounds(
  paymentDate: Date,
  tranche: SalaryTranche,
): { from: Date; to: Date } {
  const { year, month } = shiftMonth(
    paymentDate.getFullYear(),
    paymentDate.getMonth(),
    tranche.periodMonthOffset,
  );
  const last = endOfMonth(year, month);
  const fromDay = Math.min(tranche.periodFromDay, last);
  const toDay = Math.min(tranche.periodToDay, last);
  const from = startOfDay(new Date(year, month, fromDay));
  const to = startOfDay(new Date(year, month, Math.max(fromDay, toDay)));
  return { from, to };
}

export function findTrancheForPaymentDate(
  paymentDate: Date,
  tranches: SalaryTranche[] | null | undefined,
): SalaryTranche | undefined {
  const day = paymentDate.getDate();
  return normalizeSalaryTranches(tranches).find((t) => t.paymentDay === day);
}

export function getSalaryWorkPeriod(
  paymentDate: Date,
  tranches?: SalaryTranche[] | null,
): {
  from: Date;
  to: Date;
  label: string;
  paymentDay: SalaryPaymentDay;
} {
  const normalized = normalizeSalaryTranches(tranches);
  const tranche = findTrancheForPaymentDate(paymentDate, normalized);
  if (!tranche) {
    throw new Error(
      `Invalid salary payment date: no tranche for day ${paymentDate.getDate()}`,
    );
  }
  const { from, to } = resolveTranchePeriodBounds(paymentDate, tranche);
  return {
    from,
    to,
    label: formatPeriodLabel(from, to),
    paymentDay: tranche.paymentDay,
  };
}

export function calculateSalaryPaymentAmount(
  monthlyAmount: number,
  paymentDay: SalaryPaymentDay,
  paymentDate: Date,
  tranches?: SalaryTranche[] | null,
): {
  amount: number;
  workingDays: number;
  totalMonthWorkingDays: number;
  periodLabel: string;
} {
  const normalized = normalizeSalaryTranches(tranches);
  const tranche =
    normalized.find((t) => t.paymentDay === paymentDay) ??
    findTrancheForPaymentDate(paymentDate, normalized);

  if (!tranche) {
    throw new Error(
      `Invalid salary payment day: no tranche for ${paymentDay}`,
    );
  }

  const date = startOfDay(
    new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      tranche.paymentDay,
    ),
  );
  const { from, to } = resolveTranchePeriodBounds(date, tranche);
  const periodDays = countWorkingDays(from, to);
  const monthDays = countWorkingDaysInMonth(
    from.getFullYear(),
    from.getMonth(),
  );
  const amount =
    monthDays > 0 ? Math.round(monthlyAmount * (periodDays / monthDays)) : 0;

  return {
    amount,
    workingDays: periodDays,
    totalMonthWorkingDays: monthDays,
    periodLabel: formatPeriodLabel(from, to),
  };
}

export function getBimonthlyPaymentDates(
  year: number,
  month: number,
  tranches?: SalaryTranche[] | null,
): Date[] {
  return paymentDaysFromTranches(tranches).map((day) =>
    startOfDay(new Date(year, month, day)),
  );
}

export function getNextPrimaryPaymentDate(
  today: Date,
  primaryPaymentDay: SalaryPaymentDay,
): Date {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  const thisMonthCandidate = startOfDay(
    new Date(year, month, primaryPaymentDay),
  );
  if (day <= primaryPaymentDay) {
    return thisMonthCandidate;
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  return startOfDay(new Date(nextYear, nextMonth, primaryPaymentDay));
}

/** Следующий день выплаты в графике после (строго после) nominalDate. */
export function getNextSchedulePaymentDate(
  afterDate: Date,
  paymentDays: SalaryPaymentDay[],
): Date {
  const days = [...new Set(paymentDays)].sort((a, b) => a - b);
  if (!days.length) {
    throw new Error('paymentDays must not be empty');
  }

  const after = startOfDay(afterDate);
  const year = after.getFullYear();
  const month = after.getMonth();
  const day = after.getDate();

  for (const paymentDay of days) {
    if (paymentDay > day) {
      return startOfDay(new Date(year, month, paymentDay));
    }
  }

  return startOfDay(new Date(year, month + 1, days[0]!));
}

export function getUpcomingBimonthlyPayments(
  today: Date,
  targetDate: Date,
  tranches?: SalaryTranche[] | null,
): { date: Date; paymentDay: SalaryPaymentDay }[] {
  const days = paymentDaysFromTranches(tranches);
  const results: { date: Date; paymentDay: SalaryPaymentDay }[] = [];
  const cursor = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
  const end = startOfDay(targetDate);
  const start = startOfDay(today);

  while (cursor <= end) {
    for (const paymentDay of days) {
      const candidate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), paymentDay),
      );
      if (candidate >= start && candidate <= end) {
        results.push({ date: candidate, paymentDay });
      }
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function createDefaultTranche(paymentDay = 25): SalaryTranche {
  return {
    paymentDay,
    periodFromDay: 1,
    periodToDay: 31,
    periodMonthOffset: 0,
  };
}

export function createEmptyBimonthlyTranches(): SalaryTranche[] {
  return DEFAULT_BIMONTHLY_TRANCHES.map((t) => ({ ...t }));
}
