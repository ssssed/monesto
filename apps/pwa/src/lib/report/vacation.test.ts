import { describe, expect, it } from 'vitest';

import { calculateReport } from './calculateReport';
import {
  calculateSalaryPaymentAmount,
  DEFAULT_BIMONTHLY_TRANCHES,
} from './calculateSalaryPayment';
import {
  expandExpensesToLines,
  expandIncomeToLines,
  listReportCycles,
} from './dateWindow';
import {
  averageWorkingDaysPerMonth,
  calculateVacationPayout,
  resolveVacationPayDate,
} from './vacation';
import type { Expense, IncomeSource, VacationPeriod } from '../types';

const MONTHLY = 100_000;

const vacationJuly: VacationPeriod = {
  id: 1,
  start_date: '2026-07-16',
  end_date: '2026-07-31',
};

const primarySalary: IncomeSource = {
  id: 1,
  name: 'Зарплата',
  currency: 'rub',
  income_kind: 'bimonthly_salary',
  amount: null,
  monthly_amount: MONTHLY,
  is_one_time: false,
  recurrence: 'monthly',
  payment_day: null,
  is_primary: true,
  primary_payment_day: 25,
  specific_date: null,
  salary_tranches: DEFAULT_BIMONTHLY_TRANCHES,
};

describe('vacation pay', () => {
  it('считает отпускные как dayRate × календарные дни', () => {
    const avg = averageWorkingDaysPerMonth(2026);
    const payout = calculateVacationPayout(vacationJuly, MONTHLY, [10, 25]);
    expect(payout.days).toBe(16);
    expect(payout.amount).toBe(Math.round((MONTHLY / avg) * 16));
  });

  it('привязывает отпускные к ближайшему дню зарплаты (~за неделю)', () => {
    const payDate = resolveVacationPayDate(new Date(2026, 6, 16), [10, 25]);
    expect(payDate.getFullYear()).toBe(2026);
    expect(payDate.getMonth()).toBe(6);
    expect(payDate.getDate()).toBe(10);
  });

  it('отпуск 1–10 августа: отпускные в цикле 25 июля отдельно от ЗП', () => {
    const vac: VacationPeriod = {
      id: 1,
      start_date: '2026-08-01',
      end_date: '2026-08-10',
    };
    // 25 июля 2026 — суббота; отпускные должны остаться в окне цикла 25-го
    const lines = expandIncomeToLines(
      [primarySalary],
      new Date(2026, 7, 4),
      new Date(2026, 6, 25),
      new Date(2026, 6, 25),
      [vac],
    );

    expect(lines.find((l) => l.name === 'Зарплата')?.amount).toBeGreaterThan(0);
    expect(lines.find((l) => l.name === 'Отпускные')?.amount).toBe(
      Math.round((MONTHLY / averageWorkingDaysPerMonth(2026)) * 10),
    );
  });
});

describe('vacation vs salary plan — июль 16–31', () => {
  it('10 июля: зарплата за июнь + отпускные за 16–31', () => {
    const lines = expandIncomeToLines(
      [primarySalary],
      new Date(2026, 6, 1),
      new Date(2026, 6, 10),
      new Date(2026, 6, 1),
      [vacationJuly],
    );

    const salary = lines.find((l) => l.name === 'Зарплата');
    const vacation = lines.find((l) => l.name === 'Отпускные');

    expect(salary?.amount).toBeGreaterThan(0);
    expect(salary?.detail).toMatch(/июня/);
    expect(vacation?.amount).toBeGreaterThan(0);
    expect(vacation?.paymentDate.getDate()).toBe(10);
  });

  it('10 августа: зарплата за 16–31 июля = 0 (уже в отпускных)', () => {
    const calc = calculateSalaryPaymentAmount(
      MONTHLY,
      10,
      new Date(2026, 7, 10),
      DEFAULT_BIMONTHLY_TRANCHES,
      [vacationJuly],
    );
    expect(calc.amount).toBe(0);
    expect(calc.workingDays).toBe(0);
  });

  it('25 июля: зарплата за 1–15 без изменений', () => {
    const withVac = calculateSalaryPaymentAmount(
      MONTHLY,
      25,
      new Date(2026, 6, 25),
      DEFAULT_BIMONTHLY_TRANCHES,
      [vacationJuly],
    );
    const without = calculateSalaryPaymentAmount(
      MONTHLY,
      25,
      new Date(2026, 6, 25),
      DEFAULT_BIMONTHLY_TRANCHES,
    );
    expect(withVac.amount).toBe(without.amount);
    expect(withVac.amount).toBeGreaterThan(0);
  });

  it('после 25 июля в планах нет 10 августа, есть 25 августа', () => {
    const cycles = listReportCycles(new Date(2026, 6, 26), [10, 25], {
      vacations: [vacationJuly],
      monthlyAmount: MONTHLY,
      tranches: DEFAULT_BIMONTHLY_TRANCHES,
    });

    const keys = cycles.map(
      (c) =>
        `${c.nominalDate.getFullYear()}-${c.nominalDate.getMonth() + 1}-${c.nominalDate.getDate()}`,
    );

    expect(keys).not.toContain('2026-8-10');
    expect(keys).toContain('2026-7-25');
    expect(keys).toContain('2026-8-25');
  });

  it('в день пустой выплаты (10 авг) остаются прошлый цикл и план', () => {
    const cycles = listReportCycles(new Date(2026, 7, 10), [10, 25], {
      vacations: [vacationJuly],
      monthlyAmount: MONTHLY,
      tranches: DEFAULT_BIMONTHLY_TRANCHES,
    });

    const keys = cycles.map(
      (c) =>
        `${c.nominalDate.getFullYear()}-${c.nominalDate.getMonth() + 1}-${c.nominalDate.getDate()}`,
    );

    expect(keys).not.toContain('2026-8-10');
    expect(keys).toContain('2026-7-25');
    expect(keys).toContain('2026-8-25');
    expect(cycles.some((c) => !c.isPreview)).toBe(true);
    expect(cycles.some((c) => c.isPreview)).toBe(true);
  });

  it('между пустой 10-й и 25-й августа тоже прошлый + план', () => {
    const cycles = listReportCycles(new Date(2026, 7, 15), [10, 25], {
      vacations: [vacationJuly],
      monthlyAmount: MONTHLY,
      tranches: DEFAULT_BIMONTHLY_TRANCHES,
    });

    const keys = cycles.map(
      (c) =>
        `${c.nominalDate.getFullYear()}-${c.nominalDate.getMonth() + 1}-${c.nominalDate.getDate()}`,
    );

    expect(keys).toContain('2026-7-25');
    expect(keys).toContain('2026-8-25');
  });

  it('расходы пустого цикла 10 авг переезжают в окно 25 июля', () => {
    const vacationCtx = {
      vacations: [vacationJuly],
      monthlyAmount: MONTHLY,
      tranches: DEFAULT_BIMONTHLY_TRANCHES,
    };
    const cycles = listReportCycles(new Date(2026, 6, 26), [10, 25], vacationCtx);
    const july25 = cycles.find(
      (c) =>
        c.nominalDate.getFullYear() === 2026 &&
        c.nominalDate.getMonth() === 6 &&
        c.nominalDate.getDate() === 25,
    );
    const aug25 = cycles.find(
      (c) =>
        c.nominalDate.getFullYear() === 2026 &&
        c.nominalDate.getMonth() === 7 &&
        c.nominalDate.getDate() === 25,
    );

    expect(july25).toBeTruthy();
    expect(aug25).toBeTruthy();
    // Окно 25 июля тянется до 25 августа (пропуская пустую 10-ю)
    expect(july25!.expenseEndExclusive.getTime()).toBe(
      aug25!.expenseStart.getTime(),
    );

    const expense: Expense = {
      id: 1,
      name: 'Аренда',
      currency: 'rub',
      amount: 50_000,
      recurrence: 'monthly',
      due_day: 15,
      specific_date: null,
      linked_asset_id: null,
    };

    const julyLines = expandExpensesToLines(
      [expense],
      july25!.expenseStart,
      july25!.expenseEndExclusive,
    );
    const augLines = expandExpensesToLines(
      [expense],
      aug25!.expenseStart,
      aug25!.expenseEndExclusive,
    );

    // 15 августа попало бы в пустой цикл 10→25; теперь в 25 июля
    expect(julyLines.some((l) => l.name === 'Аренда')).toBe(true);
    expect(augLines.some((l) => l.name === 'Аренда')).toBe(false);
  });

  it('calculateReport: расход 15 авг в цикле 25 июля при отпуске', () => {
    const expense: Expense = {
      id: 1,
      name: 'Аренда',
      currency: 'rub',
      amount: 50_000,
      recurrence: 'monthly',
      due_day: 15,
      specific_date: null,
      linked_asset_id: null,
    };

    const report = calculateReport({
      incomes: [primarySalary],
      expenses: [expense],
      rules: [],
      assets: [],
      today: new Date(2026, 6, 26),
      cyclePaymentDay: 25,
      cycleNominalDate: new Date(2026, 6, 25),
      vacations: [vacationJuly],
    });

    expect('code' in report).toBe(false);
    if ('code' in report) return;
    expect(report.expenseLines.some((l) => l.name === 'Аренда')).toBe(true);
    expect(report.totalExpenses).toBe(50_000);
  });
});

describe('разовые доходы/расходы по окну цикла', () => {
  const bonus: IncomeSource = {
    id: 2,
    name: 'Премия',
    currency: 'rub',
    income_kind: 'regular',
    amount: 20_000,
    monthly_amount: null,
    is_one_time: true,
    recurrence: 'one_time',
    payment_day: null,
    is_primary: false,
    primary_payment_day: null,
    specific_date: '2026-08-30',
    salary_tranches: null,
  };

  const oneTimeExpense: Expense = {
    id: 2,
    name: 'Ремонт',
    currency: 'rub',
    amount: 5_000,
    recurrence: 'one_time',
    due_day: null,
    specific_date: '2026-08-30',
    linked_asset_id: null,
  };

  it('премия 30 авг в цикле 25 авг, не в плане 10 сен', () => {
    const current = calculateReport({
      incomes: [primarySalary, bonus],
      expenses: [],
      rules: [],
      assets: [],
      today: new Date(2026, 7, 30),
      cyclePaymentDay: 25,
      cycleNominalDate: new Date(2026, 7, 25),
    });
    const nextPlan = calculateReport({
      incomes: [primarySalary, bonus],
      expenses: [],
      rules: [],
      assets: [],
      today: new Date(2026, 7, 30),
      cyclePaymentDay: 10,
      cycleNominalDate: new Date(2026, 8, 10),
    });

    expect('code' in current).toBe(false);
    expect('code' in nextPlan).toBe(false);
    if ('code' in current || 'code' in nextPlan) return;

    expect(current.incomeLines.some((l) => l.name === 'Премия')).toBe(true);
    expect(nextPlan.incomeLines.some((l) => l.name === 'Премия')).toBe(false);
  });

  it('разовый расход 30 авг в цикле 25 авг, не в плане 10 сен', () => {
    const current = calculateReport({
      incomes: [primarySalary],
      expenses: [oneTimeExpense],
      rules: [],
      assets: [],
      today: new Date(2026, 7, 30),
      cyclePaymentDay: 25,
      cycleNominalDate: new Date(2026, 7, 25),
    });
    const nextPlan = calculateReport({
      incomes: [primarySalary],
      expenses: [oneTimeExpense],
      rules: [],
      assets: [],
      today: new Date(2026, 7, 30),
      cyclePaymentDay: 10,
      cycleNominalDate: new Date(2026, 8, 10),
    });

    expect('code' in current).toBe(false);
    expect('code' in nextPlan).toBe(false);
    if ('code' in current || 'code' in nextPlan) return;

    expect(current.expenseLines.some((l) => l.name === 'Ремонт')).toBe(true);
    expect(nextPlan.expenseLines.some((l) => l.name === 'Ремонт')).toBe(false);
  });
});
