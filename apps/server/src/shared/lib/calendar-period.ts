export const APP_TIME_ZONE = 'Europe/Moscow';

export type CalendarPeriod = {
  year: number;
  month: number;
  day: number;
};

export function getCalendarPeriod(
  referenceDate = new Date(),
  timeZone = APP_TIME_ZONE,
): CalendarPeriod {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(referenceDate);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error(`Failed to resolve calendar period for time zone ${timeZone}`);
  }

  return { year, month, day };
}

export function getCurrentYearMonth(
  referenceDate = new Date(),
  timeZone = APP_TIME_ZONE,
): Pick<CalendarPeriod, 'year' | 'month'> {
  const { year, month } = getCalendarPeriod(referenceDate, timeZone);
  return { year, month };
}

/** День месяца из DATE-колонки (календарная дата без смещения TZ). */
export function getDateColumnDay(value: Date): number {
  return value.getUTCDate();
}
