import { describe, expect, it } from 'vitest';

import { CARRYOVER_INCOME_NAME, calculateReport, isReportError } from './calculateReport';
import type {
  Asset,
  DistributionRule,
  Expense,
  IncomeSource,
} from '../types';

function makeIncome(overrides: Partial<IncomeSource> = {}): IncomeSource {
  return {
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
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 1,
    name: 'Аренда',
    currency: 'rub',
    amount: 60_000,
    recurrence: 'monthly',
    due_day: 5,
    specific_date: null,
    linked_asset_id: null,
    ...overrides,
  };
}

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 1,
    name: 'Подушка',
    provider: 'rub',
    purpose: null,
    goal_amount: null,
    current_amount: 1_000,
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
    ...overrides,
  };
}

function makeRule(overrides: Partial<DistributionRule> = {}): DistributionRule {
  return {
    id: 1,
    name: 'Правило',
    rule_type: 'percent',
    value: 50,
    currency: 'rub',
    target_asset_id: 1,
    sort_order: 0,
    credit_early_repay_mode: null,
    ...overrides,
  };
}

// today = день ПОСЛЕ выплаты 25-го — цикл уже наступил, isPreview = false.
const today = new Date(2026, 7, 26); // 26 августа 2026
const cycleNominalDate = new Date(2026, 7, 25); // 25 августа 2026 (вторник)

describe('calculateReport — ошибки', () => {
  it('NO_PRIMARY_SALARY, если нет доходов вообще', () => {
    const result = calculateReport({
      incomes: [],
      expenses: [],
      rules: [],
      assets: [],
      today,
    });
    expect(isReportError(result)).toBe(true);
    if (!isReportError(result)) return;
    expect(result.code).toBe('NO_PRIMARY_SALARY');
    expect(result.message).toBe('Не указана основная зарплата');
  });

  it('NO_PRIMARY_SALARY, если ни один доход не помечен is_primary', () => {
    const result = calculateReport({
      incomes: [makeIncome({ is_primary: false })],
      expenses: [],
      rules: [],
      assets: [],
      today,
    });
    expect(isReportError(result)).toBe(true);
    if (!isReportError(result)) return;
    expect(result.code).toBe('NO_PRIMARY_SALARY');
  });

  it('MISSING_USD_RATE, если фикс-правило нацелено на usd-актив без курса', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [],
      rules: [
        makeRule({ rule_type: 'fixed', currency: 'asset', value: 100, target_asset_id: 2 }),
      ],
      assets: [makeAsset({ id: 2, provider: 'usd' })],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(true);
    if (!isReportError(result)) return;
    expect(result.code).toBe('MISSING_USD_RATE');
    expect(result.message).toBe('Курс USD/RUB ещё не загружен');
  });

  it('MISSING_USD_RATE, если среди активов есть usd-провайдер без курса', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [],
      rules: [],
      assets: [makeAsset({ provider: 'usd' })],
      today,
    });
    expect(isReportError(result)).toBe(true);
    if (!isReportError(result)) return;
    expect(result.code).toBe('MISSING_USD_RATE');
  });

  it('MISSING_USD_RATE, если доход в usd без курса', () => {
    const result = calculateReport({
      incomes: [makeIncome(), makeIncome({ id: 2, is_primary: false, currency: 'usd' })],
      expenses: [],
      rules: [],
      assets: [],
      today,
    });
    expect(isReportError(result)).toBe(true);
    if (!isReportError(result)) return;
    expect(result.code).toBe('MISSING_USD_RATE');
  });

  it('MISSING_USD_RATE, если расход в usd без курса', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense({ currency: 'usd' })],
      rules: [],
      assets: [],
      today,
    });
    expect(isReportError(result)).toBe(true);
    if (!isReportError(result)) return;
    expect(result.code).toBe('MISSING_USD_RATE');
  });

  it('не требует курс, если ничего не в usd', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [],
      assets: [makeAsset()],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
  });
});

describe('calculateReport — разрешение цикла', () => {
  it('работает по умолчанию без cyclePaymentDay/cycleNominalDate', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [],
      rules: [],
      assets: [],
      today,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.paymentDay).toBe(25);
    expect(result.cycleKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('cycleNominalDate в будущем даёт isPreview = true', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 10,
      cycleNominalDate: new Date(2026, 8, 10), // 10 сентября — ещё не наступило
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.isPreview).toBe(true);
  });

  it('cycleNominalDate в прошлом даёт isPreview = false', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.isPreview).toBe(false);
    expect(result.cycleKey).toBe('2026-08-25');
    expect(result.nominalDate.getTime()).toBe(cycleNominalDate.getTime());
  });

  it('выплата на выходной сдвигается на предыдущий рабочий день', () => {
    // 1 августа 2026 — суббота; ближайшая 1-я после 15 июля — как раз она.
    const result = calculateReport({
      incomes: [makeIncome({ payment_day: 1, primary_payment_day: 1 })],
      expenses: [],
      rules: [],
      assets: [],
      today: new Date(2026, 6, 15), // 15 июля 2026
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.nominalDate.getFullYear()).toBe(2026);
    expect(result.nominalDate.getMonth()).toBe(7); // август
    expect(result.nominalDate.getDate()).toBe(1);
    // payoutDate сдвинут на пятницу 31 июля
    expect(result.payoutDate.getMonth()).toBe(6); // июль
    expect(result.payoutDate.getDate()).toBe(31);
  });
});

describe('calculateReport — доходы и расходы цикла', () => {
  it('считает totalIncome/totalExpenses и remainder ровно по строкам', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.incomeLines).toHaveLength(1);
    expect(result.totalIncome).toBe(200_000);
    expect(result.expenseLines).toHaveLength(1);
    expect(result.totalExpenses).toBe(60_000);
    expect(result.remainder).toBe(140_000);
  });

  it('remainder может быть отрицательным при расходах больше дохода', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense({ amount: 250_000 })],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.remainder).toBe(-50_000);
    expect(result.freeMoney).toBe(-50_000);
  });

  it('разовый доход/расход вне окна цикла не попадает в отчёт', () => {
    const result = calculateReport({
      incomes: [
        makeIncome(),
        makeIncome({
          id: 3,
          is_primary: false,
          is_one_time: true,
          recurrence: 'one_time',
          specific_date: '2026-09-30', // в плане 10 сентября, не в текущем цикле
          amount: 20_000,
        }),
      ],
      expenses: [],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.totalIncome).toBe(200_000);
  });
});

describe('calculateReport — перенос остатка (carry-in)', () => {
  it('без carryInRub — нет строки переноса', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.carryInRub).toBe(0);
    expect(result.incomeLines.some((l) => l.kind === 'carryover')).toBe(false);
  });

  it('отрицательный carryInRub обнуляется, строка не добавляется', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
      carryInRub: -500,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.carryInRub).toBe(0);
    expect(result.incomeLines.some((l) => l.kind === 'carryover')).toBe(false);
  });

  it('дробный carryInRub округляется', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
      carryInRub: 15_000.6,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.carryInRub).toBe(15_001);
  });

  it('добавляет строку переноса первой, увеличивает totalIncome, но не идёт в remainderForRules', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [makeRule({ rule_type: 'percent', value: 50, target_asset_id: 1 })],
      assets: [makeAsset()],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
      carryInRub: 15_000,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;

    expect(result.incomeLines[0]?.kind).toBe('carryover');
    expect(result.incomeLines[0]?.name).toBe(CARRYOVER_INCOME_NAME);
    expect(result.incomeLines[0]?.amount).toBe(15_000);
    expect(result.totalIncome).toBe(215_000); // 200 000 зарплата + 15 000 перенос
    expect(result.remainder).toBe(155_000); // 215 000 - 60 000

    // Правило считается от remainder МИНУС перенос: (155000 - 15000) * 50% = 70000
    expect(result.allocations[0]?.amountRub).toBe(70_000);
    expect(result.totalAllocations).toBe(70_000);
    expect(result.freeMoney).toBe(85_000); // 155 000 - 70 000
  });
});

describe('calculateReport — правила распределения', () => {
  it('процентное правило считается от remainderForRules', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [makeRule({ rule_type: 'percent', value: 25, target_asset_id: 1 })],
      assets: [makeAsset()],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.allocations[0]?.amountRub).toBe(35_000); // 140000 * 25%
    expect(result.freeMoney).toBe(105_000); // 140000 - 35000
  });

  it('фикс-правило в рублях не зависит от remainder', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [makeRule({ rule_type: 'fixed', currency: 'rub', value: 12_345.6, target_asset_id: 1 })],
      assets: [makeAsset()],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.allocations[0]?.amountRub).toBe(12_346); // округление
    expect(result.freeMoney).toBe(140_000 - 12_346);
  });

  it('фикс-правило в валюте актива конвертирует по курсу', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [
        makeRule({
          rule_type: 'fixed',
          currency: 'asset',
          value: 100,
          target_asset_id: 2,
        }),
      ],
      assets: [makeAsset({ id: 2, provider: 'usd', current_amount: 500 })],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
      usdRubRate: 90,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.allocations[0]?.amountRub).toBe(9_000); // 100 * 90
  });

  it('несколько правил отдаются в порядке sort_order, не по порядку в массиве', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [
        makeRule({ id: 2, name: 'Второе', sort_order: 1, value: 10, target_asset_id: 1 }),
        makeRule({ id: 1, name: 'Первое', sort_order: 0, value: 20, target_asset_id: 1 }),
      ],
      assets: [makeAsset()],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0]?.name).toBe('Первое');
    expect(result.allocations[1]?.name).toBe('Второе');
  });

  it('без правил — freeMoney равен remainder, allocations пуст', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.allocations).toHaveLength(0);
    expect(result.totalAllocations).toBe(0);
    expect(result.freeMoney).toBe(result.remainder);
  });
});

describe('calculateReport — assetSummary', () => {
  it('строит по одной строке на актив с nativeAmount/rubEquivalent', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [makeRule({ target_asset_id: 1, value: 50 })],
      assets: [
        makeAsset({ id: 1, current_amount: 1_000 }),
        makeAsset({ id: 2, name: 'Валюта', provider: 'usd', current_amount: 100 }),
      ],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
      usdRubRate: 90,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    const summary = result.assetSummary ?? [];
    expect(summary).toHaveLength(2);

    const rubAsset = summary.find((a) => a.id === 1);
    expect(rubAsset?.nativeAmount).toBe(1_000);
    expect(rubAsset?.rubEquivalent).toBe(1_000);
    expect(rubAsset?.incomingRub).toBe(70_000); // правило нацелено сюда: 140000*50%

    const usdAsset = summary.find((a) => a.id === 2);
    expect(usdAsset?.nativeAmount).toBe(100);
    expect(usdAsset?.rubEquivalent).toBe(9_000); // 100 * 90
    expect(usdAsset?.incomingRub).toBe(0); // правило не нацелено сюда
  });

  it('суммирует несколько правил на один актив в incomingRub', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense()],
      rules: [
        makeRule({ id: 1, sort_order: 0, rule_type: 'percent', value: 10, target_asset_id: 1 }),
        makeRule({ id: 2, sort_order: 1, rule_type: 'fixed', currency: 'rub', value: 5_000, target_asset_id: 1 }),
      ],
      assets: [makeAsset({ id: 1 })],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    // 140000*10% = 14000, + фикс 5000 = 19000
    expect(result.assetSummary?.[0]?.incomingRub).toBe(19_000);
  });
});

describe('calculateReport — доходы/расходы в usd', () => {
  it('доход в usd конвертируется в рубли по курсу и суммируется в totalIncome', () => {
    const result = calculateReport({
      incomes: [
        makeIncome(),
        makeIncome({
          id: 2,
          name: 'Фриланс',
          is_primary: false,
          currency: 'usd',
          amount: 1_000,
          payment_day: 25,
        }),
      ],
      expenses: [],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
      usdRubRate: 90,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    // 200000 (зарплата) + 1000*90 (фриланс)
    expect(result.totalIncome).toBe(200_000 + 90_000);
  });

  it('расход в usd конвертируется в рубли по курсу', () => {
    const result = calculateReport({
      incomes: [makeIncome()],
      expenses: [makeExpense({ currency: 'usd', amount: 500 })],
      rules: [],
      assets: [],
      today,
      cyclePaymentDay: 25,
      cycleNominalDate,
      usdRubRate: 90,
    });
    expect(isReportError(result)).toBe(false);
    if (isReportError(result)) return;
    expect(result.totalExpenses).toBe(500 * 90);
  });
});
