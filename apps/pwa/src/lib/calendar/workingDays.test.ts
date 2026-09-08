import { describe, expect, it } from 'vitest';

import { countWorkingDays, isWorkingDay, toPayoutDate } from './workingDays';

describe('isWorkingDay (RU calendar)', () => {
  it('marks weekends as non-working', () => {
    expect(isWorkingDay(new Date(2026, 2, 7))).toBe(false);
    expect(isWorkingDay(new Date(2026, 2, 8))).toBe(false);
  });

  it('marks 8 March as holiday on a weekday', () => {
    expect(isWorkingDay(new Date(2027, 2, 8))).toBe(false);
  });

  it('marks New Year holidays as non-working', () => {
    expect(isWorkingDay(new Date(2026, 0, 1))).toBe(false);
    expect(isWorkingDay(new Date(2026, 0, 8))).toBe(false);
  });

  it('marks ordinary weekday as working', () => {
    expect(isWorkingDay(new Date(2026, 2, 10))).toBe(true);
  });

  it('applies extra non-working transfer days', () => {
    expect(isWorkingDay(new Date(2026, 2, 9))).toBe(false);
  });
});

describe('toPayoutDate', () => {
  it('shifts weekend nominal to previous working day', () => {
    const sat = new Date(2026, 0, 10);
    expect(sat.getDay()).toBe(6);
    const payout = toPayoutDate(sat);
    expect(isWorkingDay(payout)).toBe(true);
    expect(payout.getTime()).toBeLessThan(sat.getTime());
    expect(payout.getFullYear()).toBe(2026);
    expect(payout.getMonth()).toBe(0);
    expect(payout.getDate()).toBe(9);
  });

  it('shifts holiday nominal to previous working day', () => {
    const may9 = new Date(2026, 4, 9);
    const payout = toPayoutDate(may9);
    expect(isWorkingDay(payout)).toBe(true);
    expect(payout.getTime()).toBeLessThan(may9.getTime());
  });
});

describe('countWorkingDays', () => {
  it('excludes Feb 23 holiday in 2026', () => {
    const from = new Date(2026, 1, 16);
    const to = new Date(2026, 1, 28);
    expect(countWorkingDays(from, to)).toBe(9);
  });
});
