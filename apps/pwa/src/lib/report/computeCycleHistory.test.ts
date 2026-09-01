import { describe, expect, it } from 'vitest';

import { computeCycleHistory } from './computeCycleHistory';
import type { Expense, IncomeSource } from '../types';

const primary: IncomeSource = {
  id: 1,
  name: 'Зарплата',
  currency: 'rub',
  income_kind: 'fixed',
  amount: 200_000,
  monthly_amount: null,
  is_one_time: false,
  recurrence: 'monthly',
  payment_day: 25,
  is_primary: true,
  primary_payment_day: 25,
  specific_date: null,
  salary_tranches: null,
};

const expenses: Expense[] = [
  {
    id: 1,
    name: 'Аренда',
    currency: 'rub',
    amount: 60_000,
    recurrence: 'monthly',
    due_day: 5,
    specific_date: null,
    linked_asset_id: null,
  },
];

describe('computeCycleHistory', () => {
  it('пусто без основного дохода', () => {
    const points = computeCycleHistory({
      incomes: [],
      expenses,
      rules: [],
      assets: [],
      today: new Date(2026, 7, 26),
    });
    expect(points).toEqual([]);
  });

  it('за 6 месяцев по ежемесячному графику — 6 точек, от старых к новым', () => {
    const points = computeCycleHistory({
      incomes: [primary],
      expenses,
      rules: [],
      assets: [],
      today: new Date(2026, 7, 26), // 26 августа 2026
      monthsBack: 6,
    });

    expect(points).toHaveLength(6);
    // Хронологический порядок: март → август.
    expect(points.map((p) => p.payoutDate.getMonth())).toEqual([2, 3, 4, 5, 6, 7]);
    expect(points[points.length - 1]?.cycleKey).toBe('2026-08-25');

    // Ни одна точка не будущая относительно today.
    for (const p of points) {
      expect(p.payoutDate.getTime()).toBeLessThanOrEqual(new Date(2026, 7, 26).getTime());
    }
  });

  it('доход/расход в каждой точке равны фиксированной сумме дохода/расхода', () => {
    const points = computeCycleHistory({
      incomes: [primary],
      expenses,
      rules: [],
      assets: [],
      today: new Date(2026, 7, 26),
      monthsBack: 3,
    });
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) {
      expect(p.totalIncome).toBe(200_000);
      expect(p.totalExpenses).toBe(60_000);
      expect(p.remainder).toBe(140_000);
    }
  });

  it('trackingStartedAt позже 6-месячного окна — не придумывает историю до него', () => {
    const points = computeCycleHistory({
      incomes: [primary],
      expenses,
      rules: [],
      assets: [],
      today: new Date(2026, 7, 26), // 26 августа 2026
      monthsBack: 6,
      trackingStartedAt: new Date(2026, 5, 1), // учёт начат 1 июня 2026
    });

    // Без ограничения было бы 6 точек (март—август); с учётом — только с июня.
    expect(points).toHaveLength(3);
    expect(points.map((p) => p.payoutDate.getMonth())).toEqual([5, 6, 7]);
    for (const p of points) {
      expect(p.payoutDate.getTime()).toBeGreaterThanOrEqual(
        new Date(2026, 5, 1).getTime(),
      );
    }
  });

  it('trackingStartedAt раньше 6-месячного окна ничего не меняет', () => {
    const withoutTracking = computeCycleHistory({
      incomes: [primary],
      expenses,
      rules: [],
      assets: [],
      today: new Date(2026, 7, 26),
      monthsBack: 6,
    });
    const withOldTracking = computeCycleHistory({
      incomes: [primary],
      expenses,
      rules: [],
      assets: [],
      today: new Date(2026, 7, 26),
      monthsBack: 6,
      trackingStartedAt: new Date(2020, 0, 1),
    });
    expect(withOldTracking).toHaveLength(withoutTracking.length);
  });

  it('якорь не берёт будущий план — последняя точка не позже today', () => {
    // 1-е число — день сразу после начала месяца, обычный сценарий "план на 25-е ещё впереди".
    const points = computeCycleHistory({
      incomes: [primary],
      expenses,
      rules: [],
      assets: [],
      today: new Date(2026, 7, 1), // 1 августа 2026
      monthsBack: 6,
    });
    const last = points[points.length - 1];
    expect(last).toBeTruthy();
    expect(last!.payoutDate.getTime()).toBeLessThanOrEqual(new Date(2026, 7, 1).getTime());
  });
});
