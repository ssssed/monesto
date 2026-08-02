import {
  countWorkingDays,
  countWorkingDaysInMonth,
  endOfMonth,
  startOfDay,
} from '../calendar/workingDays';
import type { SalaryPaymentDay } from '../types';

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

export function getSalaryWorkPeriod(paymentDate: Date): {
  from: Date;
  to: Date;
  label: string;
  paymentDay: SalaryPaymentDay;
} {
  const day = paymentDate.getDate();
  const year = paymentDate.getFullYear();
  const month = paymentDate.getMonth();

  if (day === 10) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const lastDay = endOfMonth(prevYear, prevMonth);
    const from = startOfDay(new Date(prevYear, prevMonth, 16));
    const to = startOfDay(new Date(prevYear, prevMonth, lastDay));
    return { from, to, label: formatPeriodLabel(from, to), paymentDay: 10 };
  }

  if (day === 25) {
    const from = startOfDay(new Date(year, month, 1));
    const to = startOfDay(new Date(year, month, 15));
    return { from, to, label: formatPeriodLabel(from, to), paymentDay: 25 };
  }

  throw new Error(`Invalid salary payment date: expected 10th or 25th, got ${day}`);
}

export function calculateSalaryPaymentAmount(
  monthlyAmount: number,
  paymentDay: SalaryPaymentDay,
  paymentDate: Date,
): {
  amount: number;
  workingDays: number;
  totalMonthWorkingDays: number;
  periodLabel: string;
} {
  const { from, to, label } = getSalaryWorkPeriod(paymentDate);

  if (paymentDay === 25) {
    const year = paymentDate.getFullYear();
    const month = paymentDate.getMonth();
    const periodDays = countWorkingDays(from, to);
    const monthDays = countWorkingDaysInMonth(year, month);
    const amount = Math.round(monthlyAmount * (periodDays / monthDays));
    return {
      amount,
      workingDays: periodDays,
      totalMonthWorkingDays: monthDays,
      periodLabel: label,
    };
  }

  const prevMonth = paymentDate.getMonth() === 0 ? 11 : paymentDate.getMonth() - 1;
  const prevYear =
    paymentDate.getMonth() === 0 ? paymentDate.getFullYear() - 1 : paymentDate.getFullYear();
  const periodDays = countWorkingDays(from, to);
  const monthDays = countWorkingDaysInMonth(prevYear, prevMonth);
  const amount = Math.round(monthlyAmount * (periodDays / monthDays));

  return {
    amount,
    workingDays: periodDays,
    totalMonthWorkingDays: monthDays,
    periodLabel: label,
  };
}

export function getBimonthlyPaymentDates(year: number, month: number): Date[] {
  return [startOfDay(new Date(year, month, 10)), startOfDay(new Date(year, month, 25))];
}

export function getNextPrimaryPaymentDate(
  today: Date,
  primaryPaymentDay: SalaryPaymentDay,
): Date {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  const thisMonthCandidate = startOfDay(new Date(year, month, primaryPaymentDay));
  if (day <= primaryPaymentDay) {
    return thisMonthCandidate;
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  return startOfDay(new Date(nextYear, nextMonth, primaryPaymentDay));
}

export function getUpcomingBimonthlyPayments(
  today: Date,
  targetDate: Date,
): { date: Date; paymentDay: SalaryPaymentDay }[] {
  const results: { date: Date; paymentDay: SalaryPaymentDay }[] = [];
  const cursor = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
  const end = startOfDay(targetDate);

  while (cursor <= end) {
    for (const paymentDay of [10, 25] as SalaryPaymentDay[]) {
      const candidate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), paymentDay),
      );
      if (candidate >= startOfDay(today) && candidate <= end) {
        results.push({ date: candidate, paymentDay });
      }
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}
