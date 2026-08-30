import { calculateReport, ReportCalculationError } from './calculate-report';
import { DEFAULT_BIMONTHLY_TRANCHES } from './salary-schedule';
import type {
  AssetCalc,
  DistributionRuleCalc,
  ExpenseCalc,
  IncomeSourceCalc,
} from './types';

function primaryIncome(
  overrides: Partial<IncomeSourceCalc> = {},
): IncomeSourceCalc {
  return {
    id: 1,
    name: 'Salary',
    currency: 'rub',
    incomeKind: 'fixed',
    amount: null,
    monthlyAmount: null,
    isOneTime: false,
    recurrence: 'monthly',
    paymentDay: 25,
    isPrimary: true,
    primaryPaymentDay: 25,
    specificDate: null,
    salaryTranches: null,
    ...overrides,
  };
}

function asset(overrides: Partial<AssetCalc> = {}): AssetCalc {
  return {
    id: 1,
    name: 'Копилка',
    provider: 'rub',
    goalAmount: null,
    currentAmount: 0,
    icon: 'i',
    bgColor: '#fff',
    iconColor: '#000',
    costBasisRub: 0,
    linkedExpenseId: null,
    creditAnnualRate: null,
    creditTermMonths: null,
    creditStartDate: null,
    creditRemainingMonths: null,
    creditEarlyRepayMode: null,
    ...overrides,
  };
}

describe('calculateReport', () => {
  it('throws NO_PRIMARY_SALARY when no income is flagged primary', () => {
    expect(() =>
      calculateReport({
        incomes: [],
        expenses: [],
        rules: [],
        assets: [],
        today: new Date(2026, 6, 1),
      }),
    ).toThrow(ReportCalculationError);
  });

  it('throws MISSING_USD_RATE when usd conversion is needed but no rate is given', () => {
    expect(() =>
      calculateReport({
        incomes: [
          primaryIncome({ amount: 100_000, currency: 'usd', paymentDay: 25 }),
        ],
        expenses: [],
        rules: [],
        assets: [],
        today: new Date(2026, 6, 1),
      }),
    ).toThrow(expect.objectContaining({ code: 'MISSING_USD_RATE' }));
  });

  it('computes remainder = income - expenses for a simple fixed-day salary', () => {
    const result = calculateReport({
      incomes: [primaryIncome({ amount: 100_000, paymentDay: 25 })],
      expenses: [
        {
          id: 1,
          name: 'Rent',
          currency: 'rub',
          amount: 30_000,
          recurrence: 'monthly',
          dueDay: 5,
          specificDate: null,
          linkedAssetId: null,
        } as ExpenseCalc,
      ],
      rules: [],
      assets: [],
      today: new Date(2026, 6, 1),
    });
    expect(result.totalIncome).toBe(100_000);
    expect(result.totalExpenses).toBe(30_000);
    expect(result.remainder).toBe(70_000);
    expect(result.freeMoney).toBe(70_000);
    expect(result.cycleKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('allocates via rules and tracks incomingRub per target asset', () => {
    const rule: DistributionRuleCalc = {
      id: 1,
      name: 'Save 20%',
      ruleType: 'percent',
      value: 20,
      currency: 'rub',
      targetAssetId: 1,
      sortOrder: 0,
      creditEarlyRepayMode: null,
    };
    const result = calculateReport({
      incomes: [primaryIncome({ amount: 100_000, paymentDay: 25 })],
      expenses: [],
      rules: [rule],
      assets: [asset({ id: 1 })],
      today: new Date(2026, 6, 1),
    });
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].amountRub).toBe(20_000);
    expect(result.totalAllocations).toBe(20_000);
    expect(result.freeMoney).toBe(80_000);
    expect(result.assetSummary.find((a) => a.id === 1)?.incomingRub).toBe(
      20_000,
    );
  });

  it('respects an explicit cycleNominalDate override', () => {
    const result = calculateReport({
      incomes: [primaryIncome({ amount: 100_000, paymentDay: 25 })],
      expenses: [],
      rules: [],
      assets: [],
      today: new Date(2026, 6, 1),
      cycleNominalDate: new Date(2026, 7, 25),
    });
    expect(result.nominalDate).toBe('2026-08-25');
  });

  it('produces a bimonthly report with vacation payout included', () => {
    const result = calculateReport({
      incomes: [
        primaryIncome({
          incomeKind: 'bimonthly_salary',
          monthlyAmount: 100_000,
          salaryTranches: DEFAULT_BIMONTHLY_TRANCHES,
          paymentDay: null,
          primaryPaymentDay: 25,
        }),
      ],
      expenses: [],
      rules: [],
      assets: [],
      today: new Date(2026, 6, 1),
      vacations: [
        { id: 1, startDate: '2026-07-10', endDate: '2026-07-16' } as any,
      ],
    });
    expect(result.totalIncome).toBeGreaterThan(0);
  });

  describe('carryInRub', () => {
    it('adds carry-in as an income line and raises totalIncome/remainder', () => {
      const result = calculateReport({
        incomes: [primaryIncome({ amount: 100_000, paymentDay: 25 })],
        expenses: [],
        rules: [],
        assets: [],
        today: new Date(2026, 6, 1),
        carryInRub: 15_000,
      });
      expect(result.carryInRub).toBe(15_000);
      expect(result.incomeLines.some((l) => l.kind === 'carryover')).toBe(true);
      expect(result.totalIncome).toBe(115_000);
      expect(result.remainder).toBe(115_000);
    });

    it('does not add an income line or affect totals when carryInRub is 0', () => {
      const result = calculateReport({
        incomes: [primaryIncome({ amount: 100_000, paymentDay: 25 })],
        expenses: [],
        rules: [],
        assets: [],
        today: new Date(2026, 6, 1),
        carryInRub: 0,
      });
      expect(result.carryInRub).toBe(0);
      expect(result.incomeLines.some((l) => l.kind === 'carryover')).toBe(
        false,
      );
      expect(result.totalIncome).toBe(100_000);
    });

    it('excludes carry-in from the remainder that rule allocations are computed on', () => {
      const rule: DistributionRuleCalc = {
        id: 1,
        name: 'Save 20%',
        ruleType: 'percent',
        value: 20,
        currency: 'rub',
        targetAssetId: null,
        sortOrder: 0,
        creditEarlyRepayMode: null,
      };
      const without = calculateReport({
        incomes: [primaryIncome({ amount: 100_000, paymentDay: 25 })],
        expenses: [],
        rules: [rule],
        assets: [],
        today: new Date(2026, 6, 1),
        carryInRub: 0,
      });
      const withCarry = calculateReport({
        incomes: [primaryIncome({ amount: 100_000, paymentDay: 25 })],
        expenses: [],
        rules: [rule],
        assets: [],
        today: new Date(2026, 6, 1),
        carryInRub: 50_000,
      });
      expect(withCarry.totalAllocations).toBe(without.totalAllocations);
      expect(withCarry.freeMoney).toBe(without.freeMoney + 50_000);
    });

    it('rounds and floors a negative/fractional carryInRub to a non-negative integer', () => {
      const result = calculateReport({
        incomes: [primaryIncome({ amount: 100_000, paymentDay: 25 })],
        expenses: [],
        rules: [],
        assets: [],
        today: new Date(2026, 6, 1),
        carryInRub: -500,
      });
      expect(result.carryInRub).toBe(0);
      expect(result.incomeLines.some((l) => l.kind === 'carryover')).toBe(
        false,
      );
    });
  });
});
