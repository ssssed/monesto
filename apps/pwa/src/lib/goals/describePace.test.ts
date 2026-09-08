import { describe, expect, it } from 'vitest';

import { describeGoalPace } from './describePace';

describe('describeGoalPace', () => {
  it('returns null without goal', () => {
    expect(
      describeGoalPace({
        currentAmount: 0,
        goalAmount: 0,
        deadlineIso: null,
      }),
    ).toBeNull();
  });

  it('describes remaining without deadline', () => {
    const pace = describeGoalPace({
      currentAmount: 20_000,
      goalAmount: 100_000,
      deadlineIso: null,
    });
    expect(pace?.remaining).toBe(80_000);
    expect(pace?.headline).toContain('80');
    expect(pace?.detail).toMatch(/дедлайн/i);
  });

  it('computes per-cycle amount with deadline', () => {
    const pace = describeGoalPace({
      currentAmount: 40_000,
      goalAmount: 100_000,
      deadlineIso: '2026-06-01',
      today: new Date(2026, 2, 1),
      cyclesPerMonth: 2,
    });
    expect(pace?.remaining).toBe(60_000);
    expect(pace?.cyclesLeft).toBeGreaterThan(0);
    expect(pace?.perCycle).toBeGreaterThan(0);
    expect(pace?.detail).toMatch(/зарплат/i);
  });

  it('marks goal reached', () => {
    const pace = describeGoalPace({
      currentAmount: 100_000,
      goalAmount: 100_000,
      deadlineIso: '2026-06-01',
    });
    expect(pace?.headline).toBe('Цель достигнута');
  });
});
