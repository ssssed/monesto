import { getCalendarPeriod, getCurrentYearMonth } from './calendar-period';

describe('calendar-period', () => {
  it('возвращает календарную дату Europe/Moscow', () => {
    const period = getCalendarPeriod(new Date('2026-06-01T20:30:00.000Z'));

    expect(period).toEqual({ year: 2026, month: 6, day: 1 });
  });

  it('на границе суток MSK день соответствует Москве, а не UTC', () => {
    const period = getCalendarPeriod(new Date('2026-06-23T22:30:00.000Z'));

    expect(period).toEqual({ year: 2026, month: 6, day: 24 });
  });

  it('getCurrentYearMonth возвращает year и month', () => {
    expect(getCurrentYearMonth(new Date('2026-05-31T22:00:00.000Z'))).toEqual({
      year: 2026,
      month: 6,
    });
  });
});
