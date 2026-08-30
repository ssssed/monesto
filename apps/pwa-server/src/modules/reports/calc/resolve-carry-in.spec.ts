import { findPreviousReportCycle } from './date-window';
import { resolveCarryIn } from './resolve-carry-in';
import type {
  AssetCalc,
  DistributionRuleCalc,
  ExpenseCalc,
  IncomeSourceCalc,
} from './types';

const primary: IncomeSourceCalc = {
  id: 1,
  name: 'Salary',
  currency: 'rub',
  incomeKind: 'fixed',
  amount: 100_000,
  monthlyAmount: null,
  isOneTime: false,
  recurrence: 'monthly',
  paymentDay: 25,
  isPrimary: true,
  primaryPaymentDay: 25,
  specificDate: null,
  salaryTranches: null,
};

const expenses: ExpenseCalc[] = [
  {
    id: 1,
    name: 'Rent',
    currency: 'rub',
    amount: 40_000,
    recurrence: 'monthly',
    dueDay: 1,
    specificDate: null,
    linkedAssetId: null,
  },
];

const rules: DistributionRuleCalc[] = [
  {
    id: 1,
    name: 'Save',
    ruleType: 'percent',
    value: 50,
    currency: 'rub',
    targetAssetId: 1,
    sortOrder: 0,
    creditEarlyRepayMode: null,
  },
];

const assets: AssetCalc[] = [
  {
    id: 1,
    name: 'Cushion',
    provider: 'rub',
    goalAmount: null,
    currentAmount: 0,
    icon: 'wallet',
    bgColor: '#DBEAFE',
    iconColor: '#2563EB',
    costBasisRub: 0,
    linkedExpenseId: null,
    creditAnnualRate: null,
    creditTermMonths: null,
    creditStartDate: null,
    creditRemainingMonths: null,
    creditEarlyRepayMode: null,
  },
];

function cycleFor(nominalDate: Date) {
  return {
    paymentDay: nominalDate.getDate(),
    nominalDate,
    payoutDate: nominalDate,
    expenseEndExclusive: new Date(
      nominalDate.getFullYear(),
      nominalDate.getMonth() + 1,
      nominalDate.getDate(),
    ),
    incomeStart: nominalDate,
    expenseStart: nominalDate,
    isPreview: false,
  };
}

describe('resolveCarryIn', () => {
  it('suggests the previous cycle free money once tracking has started', () => {
    const today = new Date(2026, 7, 26);
    const cycle = cycleFor(new Date(2026, 7, 25));
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
    expect(carry.isOverride).toBe(false);
  });

  it('does not invent a carry-in before tracking started', () => {
    const today = new Date(2026, 7, 26);
    const cycle = cycleFor(new Date(2026, 7, 25));

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
      trackingStartedAt: cycle.nominalDate,
    });
    expect(carry.hasPreviousCycle).toBe(false);
    expect(carry.suggestedRub).toBe(0);
    expect(carry.amountRub).toBe(0);
  });

  it('an override replaces the suggested amount but keeps it in the result', () => {
    const today = new Date(2026, 7, 26);
    const cycle = cycleFor(new Date(2026, 7, 25));
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
      getOverride: (key) => (key === '2026-08-25' ? 7_777 : null),
      getRejectedIds: () => [],
      trackingStartedAt: prev!.nominalDate,
    });
    expect(carry.isOverride).toBe(true);
    expect(carry.amountRub).toBe(7_777);
    expect(carry.suggestedRub).toBeGreaterThan(0);
  });

  it('excludes rejected allocations when computing the suggested free money', () => {
    const today = new Date(2026, 7, 26);
    const cycle = cycleFor(new Date(2026, 7, 25));
    const prev = findPreviousReportCycle(today, cycle.nominalDate, [25]);

    const accepted = resolveCarryIn({
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
    const withRejection = resolveCarryIn({
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
      getRejectedIds: (cycleKey) => (cycleKey === '2026-07-25' ? [1] : []),
      trackingStartedAt: prev!.nominalDate,
    });
    // Rejecting the 50% rule leaves its would-be allocation as free money too.
    expect(withRejection.suggestedRub).toBeGreaterThan(accepted.suggestedRub);
  });

  it('returns amountRub 0 when an override is negative or fractional', () => {
    const today = new Date(2026, 7, 26);
    const cycle = cycleFor(new Date(2026, 7, 25));
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
      getOverride: () => -10,
      getRejectedIds: () => [],
      trackingStartedAt: prev!.nominalDate,
    });
    expect(carry.amountRub).toBe(0);
    expect(carry.isOverride).toBe(true);
  });
});
