import { describe, expect, it } from 'vitest';

import {
  calculateSalaryPaymentAmount,
  DEFAULT_BIMONTHLY_TRANCHES,
} from './calculateSalaryPayment';
import { expandIncomeToLines, listReportCycles } from './dateWindow';
import {
  averageWorkingDaysPerMonth,
  calculateVacationPayout,
  resolveVacationPayDate,
} from './vacation';
import type { IncomeSource, VacationPeriod } from '../types';

const MONTHLY = 100_000;

const vacationJuly: VacationPeriod = {
  id: 1,
  start_date: '2026-07-16',
  end_date: '2026-07-31',
};

const primarySalary: IncomeSource = {
  id: 1,
  name: 'Зарплата',
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
    expect(keys).toContain('2026-8-25');
  });
});
