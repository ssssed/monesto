import { countWorkingDays, isWorkingDay } from '@/lib/calendar/workingDays';

describe('workingDays', () => {
  it('treats Saturday and Sunday as non-working', () => {
    expect(isWorkingDay(new Date(2025, 5, 21))).toBe(false);
    expect(isWorkingDay(new Date(2025, 5, 22))).toBe(false);
  });

  it('treats Monday through Friday as working', () => {
    expect(isWorkingDay(new Date(2025, 5, 16))).toBe(true);
    expect(isWorkingDay(new Date(2025, 5, 20))).toBe(true);
  });

  it('counts working days from June 16 to June 30 2025', () => {
    expect(countWorkingDays(new Date(2025, 5, 16), new Date(2025, 5, 30))).toBe(11);
  });

  it('counts working days from July 1 to July 15 2025', () => {
    expect(countWorkingDays(new Date(2025, 6, 1), new Date(2025, 6, 15))).toBe(11);
  });

  it('counts working days from July 16 to July 31 2025', () => {
    expect(countWorkingDays(new Date(2025, 6, 16), new Date(2025, 6, 31))).toBe(12);
  });

  it('returns 1 when from equals to on a weekday', () => {
    expect(countWorkingDays(new Date(2025, 6, 1), new Date(2025, 6, 1))).toBe(1);
  });

  it('returns 0 when from is after to', () => {
    expect(countWorkingDays(new Date(2025, 6, 15), new Date(2025, 6, 1))).toBe(0);
  });
});
