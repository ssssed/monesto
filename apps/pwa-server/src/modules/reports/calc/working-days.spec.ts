import {
  countWorkingDays,
  countWorkingDaysInMonth,
  endOfMonth,
  isWorkingDay,
  toPayoutDate,
} from './working-days';

describe('working-days', () => {
  it('isWorkingDay excludes Saturday/Sunday', () => {
    expect(isWorkingDay(new Date(2026, 6, 11))).toBe(false); // Sat
    expect(isWorkingDay(new Date(2026, 6, 12))).toBe(false); // Sun
    expect(isWorkingDay(new Date(2026, 6, 6))).toBe(true); // Mon
  });

  it('countWorkingDays counts Mon-Fri inclusive, excludes weekend', () => {
    // 2026-07-06 (Mon) .. 2026-07-12 (Sun) => Mon-Fri = 5
    expect(countWorkingDays(new Date(2026, 6, 6), new Date(2026, 6, 12))).toBe(
      5,
    );
  });

  it('countWorkingDays returns 0 when from > to', () => {
    expect(countWorkingDays(new Date(2026, 6, 12), new Date(2026, 6, 6))).toBe(
      0,
    );
  });

  it('endOfMonth handles February in a leap year', () => {
    expect(endOfMonth(2028, 1)).toBe(29);
    expect(endOfMonth(2026, 1)).toBe(28);
  });

  it('countWorkingDaysInMonth matches manual count for July 2026', () => {
    expect(countWorkingDaysInMonth(2026, 6)).toBe(
      countWorkingDays(new Date(2026, 6, 1), new Date(2026, 6, 31)),
    );
  });

  it('toPayoutDate shifts a weekend date back to the preceding Friday', () => {
    // 2026-07-25 is a Saturday
    const payout = toPayoutDate(new Date(2026, 6, 25));
    expect(payout.getDay()).toBe(5);
    expect(payout.getDate()).toBe(24);
  });

  it('toPayoutDate leaves a working day untouched', () => {
    const payout = toPayoutDate(new Date(2026, 6, 24)); // Friday
    expect(payout.getTime()).toBe(new Date(2026, 6, 24).getTime());
  });
});
