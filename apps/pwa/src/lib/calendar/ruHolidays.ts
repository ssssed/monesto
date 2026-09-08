/** Нерабочие праздничные дни РФ (месяц 1–12). */
export const RU_FIXED_HOLIDAYS: ReadonlyArray<{ month: number; day: number }> = [
  { month: 1, day: 1 },
  { month: 1, day: 2 },
  { month: 1, day: 3 },
  { month: 1, day: 4 },
  { month: 1, day: 5 },
  { month: 1, day: 6 },
  { month: 1, day: 7 },
  { month: 1, day: 8 },
  { month: 2, day: 23 },
  { month: 3, day: 8 },
  { month: 5, day: 1 },
  { month: 5, day: 9 },
  { month: 6, day: 12 },
  { month: 11, day: 4 },
];

/**
 * Доп. нерабочие дни (переносы по постановлениям).
 * Ключ — YYYY-MM-DD.
 */
const RU_EXTRA_NON_WORKING: ReadonlySet<string> = new Set([
  '2024-04-29',
  '2024-04-30',
  '2024-05-10',
  '2024-12-30',
  '2024-12-31',
  '2025-05-02',
  '2025-05-08',
  '2025-06-13',
  '2025-11-03',
  '2025-12-31',
  '2026-03-09',
  '2026-05-04',
  '2026-05-11',
  '2026-11-03',
  '2026-12-31',
  '2027-02-22',
  '2027-05-03',
  '2027-05-10',
  '2027-06-14',
  '2027-11-05',
  '2027-12-31',
]);

/**
 * Рабочие субботы / воскресенья (компенсация переносов).
 * Ключ — YYYY-MM-DD.
 */
const RU_EXTRA_WORKING: ReadonlySet<string> = new Set([
  '2024-04-27',
  '2024-11-02',
  '2024-12-28',
]);

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isRuFixedHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return RU_FIXED_HOLIDAYS.some((h) => h.month === month && h.day === day);
}

export function isRuNonWorkingDay(date: Date): boolean {
  const key = toKey(date);
  if (RU_EXTRA_WORKING.has(key)) return false;
  if (RU_EXTRA_NON_WORKING.has(key)) return true;
  return isRuFixedHoliday(date);
}
