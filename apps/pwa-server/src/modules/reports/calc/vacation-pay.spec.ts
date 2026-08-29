import {
  averageWorkingDaysPerMonth,
  calculateVacationPayout,
  calendarDaysInclusive,
  countWorkingDaysExcludingVacation,
  isDateInVacation,
  listVacationPayouts,
  parseIsoDate,
  resolveVacationPayDate,
  toIsoDate,
  vacationDayRate,
} from './vacation-pay';
import type { VacationPeriodCalc } from './types';

const vacation: VacationPeriodCalc = {
  id: 1,
  startDate: '2026-07-10',
  endDate: '2026-07-16',
};

describe('vacation-pay', () => {
  it('parseIsoDate/toIsoDate round-trip without UTC drift', () => {
    const date = parseIsoDate('2026-07-10');
    expect(toIsoDate(date)).toBe('2026-07-10');
  });

  it('calendarDaysInclusive counts both endpoints', () => {
    expect(
      calendarDaysInclusive(new Date(2026, 6, 10), new Date(2026, 6, 16)),
    ).toBe(7);
  });

  it('calendarDaysInclusive returns 0 when end is before start', () => {
    expect(
      calendarDaysInclusive(new Date(2026, 6, 16), new Date(2026, 6, 10)),
    ).toBe(0);
  });

  it('isDateInVacation is inclusive of both boundary dates', () => {
    expect(isDateInVacation(new Date(2026, 6, 10), [vacation])).toBe(true);
    expect(isDateInVacation(new Date(2026, 6, 16), [vacation])).toBe(true);
    expect(isDateInVacation(new Date(2026, 6, 17), [vacation])).toBe(false);
  });

  it('countWorkingDaysExcludingVacation removes vacation days that fall on weekdays', () => {
    const withoutVacation = countWorkingDaysExcludingVacation(
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      [],
    );
    const withVacation = countWorkingDaysExcludingVacation(
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      [vacation],
    );
    expect(withVacation).toBeLessThan(withoutVacation);
  });

  it('averageWorkingDaysPerMonth/vacationDayRate are internally consistent', () => {
    const avg = averageWorkingDaysPerMonth(2026);
    expect(vacationDayRate(avg * 100, 2026)).toBeCloseTo(100, 5);
  });

  it('resolveVacationPayDate falls back to ~7 days before start with no schedule', () => {
    const payDate = resolveVacationPayDate(new Date(2026, 6, 10), []);
    expect(toIsoDate(payDate)).toBe('2026-07-03');
  });

  it('resolveVacationPayDate snaps to a nearby schedule day within 3 days', () => {
    // ideal = July 3; schedule day 25 (prev month) is 8 days away (too far),
    // schedule day 10 (current month) is after start so excluded — with [1] only 1 is within tolerance
    const payDate = resolveVacationPayDate(new Date(2026, 6, 10), [1]);
    expect(toIsoDate(payDate)).toBe('2026-07-01');
  });

  it('calculateVacationPayout computes amount = dayRate * calendar days', () => {
    const payout = calculateVacationPayout(vacation, 100_000, []);
    expect(payout.days).toBe(7);
    expect(payout.amount).toBe(Math.round(payout.dayRate * 7));
  });

  it('listVacationPayouts sorts by payment date ascending', () => {
    const later: VacationPeriodCalc = {
      id: 2,
      startDate: '2026-08-10',
      endDate: '2026-08-12',
    };
    const payouts = listVacationPayouts([later, vacation], 100_000, []);
    expect(payouts.map((p) => p.vacationId)).toEqual([1, 2]);
  });
});
