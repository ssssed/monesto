import {
  countWorkingDays,
  countWorkingDaysInMonth,
  isWorkingDay,
  startOfDay,
} from './calendar/working-days';
import type { SalaryPaymentDay, VacationPeriod } from '@/kernel/types';

/** За сколько дней до начала отпуска приходят отпускные (если график выплат не задан). */
export const VACATION_PAY_DAYS_BEFORE = 7;

/**
 * Минимальный запас перед отпуском (по ТК РФ отпускные платят не позднее
 * чем за 3 дня до начала) — ближайшая к отпуску выплата, не дающая такого
 * запаса, считается слишком рискованной: берём предыдущую.
 */
export const VACATION_PAY_MIN_SAFE_DAYS = 3;

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return startOfDay(new Date(year!, month! - 1, day!));
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
  vacations: VacationPeriod[],
): boolean {
  const t = startOfDay(date).getTime();
  return vacations.some((v) => {
    const from = parseIsoDate(v.start_date).getTime();
    const to = parseIsoDate(v.end_date).getTime();
    return t >= from && t <= to;
  });
}

/** Рабочие дни периода минус дни, попадающие в отпуск. */
export function countWorkingDaysExcludingVacation(
  from: Date,
  to: Date,
  vacations: VacationPeriod[],
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
 * Дата отпускных: ближайшая выплата по графику ДО начала отпуска, дающая
 * не меньше VACATION_PAY_MIN_SAFE_DAYS запаса; если ближайшая выплата
 * слишком близко к старту отпуска (риск не уложиться в срок по ТК РФ) —
 * берём предыдущую по графику. Без графика — ≈ за неделю до начала.
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

  const candidates: Date[] = [];
  for (let monthOffset = -2; monthOffset <= 0; monthOffset += 1) {
    for (const day of scheduleDays) {
      const candidate = startOfDay(
        new Date(start.getFullYear(), start.getMonth() + monthOffset, day),
      );
      if (candidate < start) candidates.push(candidate);
    }
  }
  candidates.sort((a, b) => b.getTime() - a.getTime());

  for (const candidate of candidates) {
    const gapDays = (start.getTime() - candidate.getTime()) / 86_400_000;
    if (gapDays >= VACATION_PAY_MIN_SAFE_DAYS) return candidate;
  }

  return candidates[0] ?? ideal;
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
  vacation: VacationPeriod,
  monthlyAmount: number,
  scheduleDays: SalaryPaymentDay[] = [],
): VacationPayout {
  const start = parseIsoDate(vacation.start_date);
  const end = parseIsoDate(vacation.end_date);
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
  vacations: VacationPeriod[],
  monthlyAmount: number,
  scheduleDays: SalaryPaymentDay[] = [],
): VacationPayout[] {
  return vacations
    .map((v) => calculateVacationPayout(v, monthlyAmount, scheduleDays))
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
}

/** Нормализует диапазон: start <= end. */
export function normalizeVacationRange(
  start: string,
  end: string,
): { start_date: string; end_date: string } {
  if (start <= end) return { start_date: start, end_date: end };
  return { start_date: end, end_date: start };
}
