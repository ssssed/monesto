import { calculateReport, isReportError } from '@/lib/report/calculateReport';
import type { Asset, DistributionRule, Expense, IncomeSource } from '@/lib/types';

const primarySalary: IncomeSource = {
  id: 1,
  name: 'Зарплата',
  income_kind: 'bimonthly_salary',
  amount: null,
  monthly_amount: 100_000,
  is_one_time: false,
  recurrence: 'monthly',
  payment_day: null,
  is_primary: true,
  primary_payment_day: 25,
  specific_date: null,
};

const stipend: IncomeSource = {
  id: 2,
  name: 'Стипендия',
  income_kind: 'fixed',
  amount: 13_000,
  monthly_amount: null,
  is_one_time: false,
  recurrence: 'monthly',
  payment_day: 15,
  is_primary: false,
  primary_payment_day: null,
  specific_date: null,
};

const expenses: Expense[] = [
  { id: 1, name: 'Кредит', amount: 35_000, recurrence: 'monthly', due_day: 20, specific_date: null },
  { id: 2, name: 'Английский', amount: 10_000, recurrence: 'monthly', due_day: 20, specific_date: null },
];

const rules: DistributionRule[] = [
  {
    id: 1,
    name: 'Подушка безопасности',
    rule_type: 'percent',
    value: 10,
    currency: 'rub',
    target_asset_id: null,
    sort_order: 0,
  },
  {
    id: 2,
    name: 'Непредвиденные',
    rule_type: 'percent',
    value: 10,
    currency: 'rub',
    target_asset_id: null,
    sort_order: 1,
  },
];

describe('calculateReport', () => {
  it('calculates current cycle after 10th with remaining expenses', () => {
    const result = calculateReport({
      incomes: [primarySalary, stipend],
      expenses,
      rules,
      assets: [],
      today: new Date(2025, 6, 12),
      usdRubRate: 82,
      cyclePaymentDay: 10,
    });

    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;

    expect(result.paymentDay).toBe(10);
    expect(result.isPreview).toBe(false);
    expect(result.totalExpenses).toBe(45_000);
    expect(result.remainder).toBe(result.totalIncome - 45_000);
    expect(result.allocations[0]?.amountRub).toBe(Math.round(result.remainder * 0.1));
    expect(result.freeMoney).toBe(result.remainder - result.totalAllocations);
  });

  it('preview cycle to 25th excludes expenses before payout', () => {
    const result = calculateReport({
      incomes: [primarySalary, stipend],
      expenses,
      rules,
      assets: [],
      today: new Date(2025, 6, 12),
      usdRubRate: 82,
      cyclePaymentDay: 25,
    });

    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;

    expect(result.paymentDay).toBe(25);
    expect(result.isPreview).toBe(true);
    expect(result.incomeLines.some((line) => line.name === 'Стипендия')).toBe(true);
    // due_day 20 до выплаты 25-го в этот цикл не входит
    expect(result.totalExpenses).toBe(0);
  });

  it('includes usd asset rub equivalent in summary', () => {
    const assets: Asset[] = [
      {
        id: 1,
        name: 'USD',
        provider: 'usd',
        purpose: null,
        goal_amount: null,
        current_amount: 500,
        steam_inventory_url: null,
        icon: 'logo-usd',
        bg_color: '#DBEAFE',
        icon_color: '#2563EB',
        cost_basis_rub: 36000,
      },
    ];

    const result = calculateReport({
      incomes: [primarySalary],
      expenses: [],
      rules: [],
      assets,
      today: new Date(2025, 6, 10),
      usdRubRate: 82,
    });

    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;

    expect(result.assetSummary?.[0]?.rubEquivalent).toBe(41_000);
  });

  it('subtracts fixed usd rule converted to rub from free money', () => {
    const assets: Asset[] = [
      {
        id: 1,
        name: 'USD резерв',
        provider: 'usd',
        purpose: null,
        goal_amount: null,
        current_amount: 0,
        steam_inventory_url: null,
        icon: 'logo-usd',
        bg_color: '#DBEAFE',
        icon_color: '#2563EB',
        cost_basis_rub: 0,
      },
    ];

    const usdRule: DistributionRule = {
      id: 3,
      name: 'USD-резерв',
      rule_type: 'fixed',
      value: 50,
      currency: 'asset',
      target_asset_id: 1,
      sort_order: 2,
    };

    const result = calculateReport({
      incomes: [primarySalary, stipend],
      expenses,
      rules: [...rules, usdRule],
      assets,
      today: new Date(2025, 6, 10),
      usdRubRate: 82,
    });

    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;

    expect(result.allocations.some((item) => item.amountRub === 4100)).toBe(true);
  });

  it('returns error when primary salary is missing', () => {
    const result = calculateReport({
      incomes: [stipend],
      expenses,
      rules,
      assets: [],
      today: new Date(2025, 6, 10),
      usdRubRate: 82,
    });

    expect(isReportError(result)).toBe(true);
    if (!isReportError(result)) return;
    expect(result.code).toBe('NO_PRIMARY_SALARY');
  });

  it('returns error when usd rate is missing and usd assets exist', () => {
    const result = calculateReport({
      incomes: [primarySalary],
      expenses: [],
      rules: [],
      assets: [
        {
          id: 1,
          name: 'USD',
          provider: 'usd',
          purpose: null,
          goal_amount: null,
          current_amount: 100,
          steam_inventory_url: null,
          icon: 'logo-usd',
          bg_color: '#DBEAFE',
          icon_color: '#2563EB',
          cost_basis_rub: 7200,
        },
      ],
      today: new Date(2025, 6, 10),
    });

    expect(isReportError(result)).toBe(true);
    if (!isReportError(result)) return;
    expect(result.code).toBe('MISSING_USD_RATE');
  });
});
