/**
 * Postgres `@db.Date` columns round-trip through Prisma as UTC-midnight
 * `Date` objects (verified empirically: a stored "2026-07-01" comes back as
 * `2026-07-01T00:00:00.000Z`). Reading that with LOCAL getters on a server
 * whose timezone is behind UTC would shift the calendar date back by a day —
 * always use UTC getters to recover the intended date, then hand the
 * resulting ISO string to `parseDate`, which reconstructs a LOCAL calendar
 * `Date` for the actual cycle/day-counting arithmetic (self-consistent as
 * long as every date in the calc layer goes through the same construction).
 */
export function prismaDateOnlyToIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
