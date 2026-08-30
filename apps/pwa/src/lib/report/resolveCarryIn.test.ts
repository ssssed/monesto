import { describe, expect, it } from 'vitest';

import { calculateReport, isReportError } from './calculateReport';
import { findPreviousReportCycle } from './dateWindow';
import { resolveCarryIn } from './resolveCarryIn';
import type {
  Asset,
  DistributionRule,
  Expense,
  IncomeSource,
} from '../types';

const primary: IncomeSource = {
  id: 1,
  name: 'Зарплата',
  currency: 'rub',
  income_kind: 'fixed',
  amount: 100_000,
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
    name: 'Жильё',
    currency: 'rub',
    amount: 40_000,
    recurrence: 'monthly',
    due_day: 1,
    specific_date: null,
    linked_asset_id: null,
  },
];

const rules: DistributionRule[] = [
  {
    id: 1,
    name: 'Подушка',
    rule_type: 'percent',
    value: 50,
    currency: 'rub',
    target_asset_id: 1,
    sort_order: 0,
    credit_early_repay_mode: null,
  },
];

const assets: Asset[] = [
  {
    id: 1,
    name: 'Подушка',
    provider: 'rub',
    purpose: null,
    goal_amount: null,
    current_amount: 0,
    steam_inventory_url: null,
    icon: 'wallet',
    bg_color: '#DBEAFE',
    icon_color: '#2563EB',
    cost_basis_rub: 0,
    linked_expense_id: null,
    credit_annual_rate: null,
    credit_term_months: null,
    credit_start_date: null,
    credit_remaining_months: null,
    credit_early_repay_mode: null,
    sort_order: 0,
  },
];

describe('carryover from previous cycle', () => {
  it('adds carry-in as income line and raises remainder', () => {
    const today = new Date(2026, 7, 26);
    const result = calculateReport({
      incomes: [primary],
      expenses,
      rules,
      assets,
      today,
      cyclePaymentDay: 25,
      cycleNominalDate: new Date(2026, 7, 25),
      carryInRub: 15_000,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.carryInRub).toBe(15_000);
    expect(result.incomeLines.some((l) => l.kind === 'carryover')).toBe(true);
    expect(result.totalIncome).toBeGreaterThanOrEqual(115_000);
  });

  it('does not apply rules to carry-in', () => {
    const today = new Date(2026, 7, 26);
    const without = calculateReport({
      incomes: [primary],
      expenses,
      rules,
      assets,
      today,
      cyclePaymentDay: 25,
      cycleNominalDate: new Date(2026, 7, 25),
      carryInRub: 0,
    });
    const withCarry = calculateReport({
      incomes: [primary],
      expenses,
      rules,
      assets,
      today,
      cyclePaymentDay: 25,
      cycleNominalDate: new Date(2026, 7, 25),
      carryInRub: 50_000,
    });
    expect(isReportError(without)).toBe(false);
    expect(isReportError(withCarry)).toBe(false);
    if (isReportError(without) || isReportError(withCarry)) return;
    expect(withCarry.totalAllocations).toBe(without.totalAllocations);
    expect(withCarry.freeMoney).toBe(without.freeMoney + 50_000);
  });

  it('resolveCarryIn suggests previous free money after tracking start', () => {
    const today = new Date(2026, 7, 26);
    const cycle = {
      paymentDay: 25,
      nominalDate: new Date(2026, 7, 25),
      payoutDate: new Date(2026, 7, 25),
      expenseEndExclusive: new Date(2026, 8, 25),
      incomeStart: new Date(2026, 7, 25),
      expenseStart: new Date(2026, 7, 25),
      isPreview: false,
    };
    const prev = findPreviousReportCycle(today, cycle.nominalDate, [25]);
    expect(prev).not.toBeNull();

    const carry = resolveCarryIn({
      today,
      cycle,
      scheduleDays: [25],
      incomes: [primary],
      expenses,
      rules,
      assets,
      vacations: [],
      usdRubRate: 82,
      getOverride: () => null,
      getRejectedIds: () => [],
      trackingStartedAt: prev!.nominalDate,
    });
    expect(carry.hasPreviousCycle).toBe(true);
    expect(carry.suggestedRub).toBeGreaterThan(0);
    expect(carry.amountRub).toBe(carry.suggestedRub);
  });

  it('does not invent carry before tracking started', () => {
    const today = new Date(2026, 7, 26);
    const cycle = {
      paymentDay: 25,
      nominalDate: new Date(2026, 7, 25),
      payoutDate: new Date(2026, 7, 25),
      expenseEndExclusive: new Date(2026, 8, 25),
      incomeStart: new Date(2026, 7, 25),
      expenseStart: new Date(2026, 7, 25),
      isPreview: false,
    };
    const carry = resolveCarryIn({
      today,
      cycle,
      scheduleDays: [25],
      incomes: [primary],
      expenses,
      rules,
      assets,
      vacations: [],
      usdRubRate: 82,
      getOverride: () => null,
      getRejectedIds: () => [],
      trackingStartedAt: new Date(2026, 7, 25),
    });
    expect(carry.hasPreviousCycle).toBe(false);
    expect(carry.suggestedRub).toBe(0);
    expect(carry.amountRub).toBe(0);
  });

  it('override replaces suggested amount', () => {
    const today = new Date(2026, 7, 26);
    const cycle = {
      paymentDay: 25,
      nominalDate: new Date(2026, 7, 25),
      payoutDate: new Date(2026, 7, 25),
      expenseEndExclusive: new Date(2026, 8, 25),
      incomeStart: new Date(2026, 7, 25),
      expenseStart: new Date(2026, 7, 25),
      isPreview: false,
    };
    const prev = findPreviousReportCycle(today, cycle.nominalDate, [25]);
    const carry = resolveCarryIn({
      today,
      cycle,
      scheduleDays: [25],
      incomes: [primary],
      expenses,
      rules,
      assets,
      vacations: [],
      usdRubRate: 82,
      getOverride: (key) => (key === '2026-08-25' ? 7777 : null),
      getRejectedIds: () => [],
      trackingStartedAt: prev!.nominalDate,
    });
    expect(carry.isOverride).toBe(true);
    expect(carry.amountRub).toBe(7777);
  });
});
