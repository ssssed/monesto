import type { WishlistItem } from '@/kernel/types';

/**
 * Запланированные хотелки, чья дата покупки попадает в период [startIso, endExclusiveIso).
 * Даты — ISO YYYY-MM-DD, сравниваются лексикографически (это корректно для этого формата).
 */
export function plannedWishlistItemsInPeriod(
  items: WishlistItem[],
  startIso: string,
  endExclusiveIso: string,
): WishlistItem[] {
  return items
    .filter(
      (item) =>
        item.planned_date != null &&
        item.planned_date >= startIso &&
        item.planned_date < endExclusiveIso,
    )
    .sort((a, b) => (a.planned_date as string).localeCompare(b.planned_date as string));
}
