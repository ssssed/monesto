/** Рабочий день = пн–пт. Сб/вс не считаются. */
export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

/** Кол-во рабочих дней в [from, to] включительно. */
export function countWorkingDays(from: Date, to: Date): number {
  if (from > to) return 0;

  const start = startOfDay(from);
  const end = startOfDay(to);
  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    if (isWorkingDay(cursor)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function countWorkingDaysInMonth(year: number, month: number): number {
  const last = endOfMonth(year, month);
  return countWorkingDays(new Date(year, month, 1), new Date(year, month, last));
}
