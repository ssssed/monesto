import { describe, expect, it } from 'vitest';

import { plannedWishlistItemsInPeriod } from './planned-in-period';
import type { WishlistItem } from '@/kernel/types';

function makeItem(overrides: Partial<WishlistItem>): WishlistItem {
  return {
    id: 1,
    name: 'Наушники',
    currency: 'rub',
    price: 15_000,
    url: null,
    note: null,
    icon: 'sparkles',
    bg_color: '#FCE7F3',
    icon_color: '#DB2777',
    sort_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    planned_date: null,
    ...overrides,
  };
}

describe('plannedWishlistItemsInPeriod', () => {
  it('excludes items without a planned date', () => {
    const items = [makeItem({ id: 1, planned_date: null })];
    expect(plannedWishlistItemsInPeriod(items, '2026-10-25', '2026-11-10')).toEqual([]);
  });

  it('excludes items outside the period', () => {
    const items = [
      makeItem({ id: 1, planned_date: '2026-10-02' }),
      makeItem({ id: 2, planned_date: '2026-11-10' }),
      makeItem({ id: 3, planned_date: '2026-12-01' }),
    ];
    expect(plannedWishlistItemsInPeriod(items, '2026-10-25', '2026-11-10')).toEqual([]);
  });

  it('includes items at the start boundary, excludes the end boundary', () => {
    const items = [
      makeItem({ id: 1, planned_date: '2026-10-25' }),
      makeItem({ id: 2, planned_date: '2026-11-10' }),
    ];
    const result = plannedWishlistItemsInPeriod(items, '2026-10-25', '2026-11-10');
    expect(result.map((i) => i.id)).toEqual([1]);
  });

  it('sorts matches by date ascending', () => {
    const items = [
      makeItem({ id: 1, planned_date: '2026-11-01' }),
      makeItem({ id: 2, planned_date: '2026-10-26' }),
    ];
    const result = plannedWishlistItemsInPeriod(items, '2026-10-25', '2026-11-10');
    expect(result.map((i) => i.id)).toEqual([2, 1]);
  });
});
