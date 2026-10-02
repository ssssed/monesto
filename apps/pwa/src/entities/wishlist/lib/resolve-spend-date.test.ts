import { describe, expect, it } from 'vitest';

import { resolveSpendDateIso } from './resolve-spend-date';

describe('resolveSpendDateIso', () => {
  it('uses the planned date, not today — regression: must not fall into the current cycle', () => {
    expect(
      resolveSpendDateIso({ planned_date: '2026-10-25' }, '2026-10-02'),
    ).toBe('2026-10-25');
  });

  it('falls back to today only when nothing was planned', () => {
    expect(resolveSpendDateIso({ planned_date: null }, '2026-10-02')).toBe(
      '2026-10-02',
    );
  });
});
