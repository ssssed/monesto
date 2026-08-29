import {
  countWorkingDays,
  countWorkingDaysInMonth,
  isWorkingDay,
  startOfDay,
} from './working-days';
import type { SalaryPaymentDay, VacationPeriodCalc } from './types';

/** За сколько дней до начала отпуска приходят отпускные. */
export const VACATION_PAY_DAYS_BEFORE = 7;

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calendarDaysInclusive(from: Date, to: Date): number {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function averageWorkingDaysPerMonth(year: number): number {
  let total = 0;
  for (let month = 0; month < 12; month += 1) {
    total += countWorkingDaysInMonth(year, month);
  }
  return total / 12;
}

/** Стоимость дня = оклад / среднее число р.д. в месяце года. */
export function vacationDayRate(monthlyAmount: number, year: number): number {
  const avg = averageWorkingDaysPerMonth(year);
  return avg > 0 ? monthlyAmount / avg : 0;
}

export function isDateInVacation(
  date: Date,
  vacations: VacationPeriodCalc[],
): boolean {
  const t = startOfDay(date).getTime();
  return vacations.some((v) => {
    const from = parseIsoDate(v.startDate).getTime();
    const to = parseIsoDate(v.endDate).getTime();
    return t >= from && t <= to;
  });
}

/** Рабочие дни периода минус дни, попадающие в отпуск. */
export function countWorkingDaysExcludingVacation(
  from: Date,
  to: Date,
  vacations: VacationPeriodCalc[],
): number {
  if (from > to) return 0;
  if (!vacations.length) return countWorkingDays(from, to);

  const start = startOfDay(from);
  const end = startOfDay(to);
  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    if (isWorkingDay(cursor) && !isDateInVacation(cursor, vacations)) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/**
 * Дата отпускных: ≈ за неделю до начала.
 * Если рядом есть день зарплаты (±3 дня) — привязываем к нему.
 * Возвращает номинальную дату (как у транша зарплаты); сдвиг с выходного — снаружи.
 */
export function resolveVacationPayDate(
  vacationStart: Date,
  scheduleDays: SalaryPaymentDay[] = [],
): Date {
  const start = startOfDay(vacationStart);
  const ideal = startOfDay(
    new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() - VACATION_PAY_DAYS_BEFORE,
    ),
  );

  if (!scheduleDays.length) return ideal;

  let best: Date | null = null;
  let bestDist = Infinity;

  for (let monthOffset = -1; monthOffset <= 0; monthOffset += 1) {
    for (const day of scheduleDays) {
      const candidate = startOfDay(
        new Date(ideal.getFullYear(), ideal.getMonth() + monthOffset, day),
      );
      if (candidate >= start) continue;
      const dist = Math.abs(
        (candidate.getTime() - ideal.getTime()) / 86_400_000,
      );
      if (dist <= 3 && dist < bestDist) {
        best = candidate;
        bestDist = dist;
      }
    }
  }

  return best ?? ideal;
}

export interface VacationPayout {
  vacationId: number;
  start: Date;
  end: Date;
  days: number;
  amount: number;
  /** Дата выплаты отпускных (≈ за неделю до начала). */
  paymentDate: Date;
  dayRate: number;
  avgWorkingDays: number;
}

export function calculateVacationPayout(
  vacation: VacationPeriodCalc,
  monthlyAmount: number,
  scheduleDays: SalaryPaymentDay[] = [],
): VacationPayout {
  const start = parseIsoDate(vacation.startDate);
  const end = parseIsoDate(vacation.endDate);
  const days = calendarDaysInclusive(start, end);
  const year = start.getFullYear();
  const avgWorkingDays = averageWorkingDaysPerMonth(year);
  const dayRate = vacationDayRate(monthlyAmount, year);
  const amount = Math.round(dayRate * days);

  return {
    vacationId: vacation.id,
    start,
    end,
    days,
    amount,
    paymentDate: resolveVacationPayDate(start, scheduleDays),
    dayRate,
    avgWorkingDays,
  };
}

export function listVacationPayouts(
  vacations: VacationPeriodCalc[],
  monthlyAmount: number,
  scheduleDays: SalaryPaymentDay[] = [],
): VacationPayout[] {
  return vacations
    .map((v) => calculateVacationPayout(v, monthlyAmount, scheduleDays))
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
}
