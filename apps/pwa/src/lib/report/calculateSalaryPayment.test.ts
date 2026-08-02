import { describe, expect, it } from 'vitest';

import {
  countWorkingDays,
  countWorkingDaysInMonth,
} from '../calendar/workingDays';
import {
  DEFAULT_BIMONTHLY_TRANCHES,
  calculateSalaryPaymentAmount,
  resolveTranchePeriodBounds,
} from './calculateSalaryPayment';
import type { SalaryTranche } from '../types';

const MONTHLY = 100_000;

/** Февраль 2024 — стабильный месяц для регрессии. */
const PAY_10 = new Date(2024, 1, 10);
const PAY_25 = new Date(2024, 1, 25);
const PAY_5 = new Date(2024, 1, 5);
const PAY_20 = new Date(2024, 1, 20);

const CUSTOM_5_20: SalaryTranche[] = [
  {
    paymentDay: 5,
    periodFromDay: 16,
    periodToDay: 31,
    periodMonthOffset: -1,
  },
  {
    paymentDay: 20,
    periodFromDay: 1,
    periodToDay: 15,
    periodMonthOffset: 0,
  },
];

function expectedAmount(
  monthly: number,
  paymentDate: Date,
  tranche: SalaryTranche,
): {
  amount: number;
  workingDays: number;
  monthDays: number;
} {
  const { from, to } = resolveTranchePeriodBounds(paymentDate, tranche);
  const workingDays = countWorkingDays(from, to);
  const monthDays = countWorkingDaysInMonth(from.getFullYear(), from.getMonth());
  return {
    amount: Math.round(monthly * (workingDays / monthDays)),
    workingDays,
    monthDays,
  };
}

describe('calculateSalaryPaymentAmount — классический график 10 и 25', () => {
  it('25-е: период 1–15 текущего месяца, только рабочие дни', () => {
    const tranche = DEFAULT_BIMONTHLY_TRANCHES[1]!;
    const expected = expectedAmount(MONTHLY, PAY_25, tranche);
    const result = calculateSalaryPaymentAmount(
      MONTHLY,
      25,
      PAY_25,
      DEFAULT_BIMONTHLY_TRANCHES,
    );

    expect(result.periodLabel).toBe('1–15 февраля');
    expect(result.workingDays).toBe(expected.workingDays);
    expect(result.totalMonthWorkingDays).toBe(expected.monthDays);
    expect(result.amount).toBe(expected.amount);
    expect(result.amount).toBe(Math.round(MONTHLY * (11 / 21)));
  });

  it('10-е: период 16–конец прошлого месяца, только рабочие дни', () => {
    const tranche = DEFAULT_BIMONTHLY_TRANCHES[0]!;
    const expected = expectedAmount(MONTHLY, PAY_10, tranche);
    const result = calculateSalaryPaymentAmount(
      MONTHLY,
      10,
      PAY_10,
      DEFAULT_BIMONTHLY_TRANCHES,
    );

    expect(result.periodLabel).toBe('16–31 января');
    expect(result.workingDays).toBe(expected.workingDays);
    expect(result.totalMonthWorkingDays).toBe(expected.monthDays);
    expect(result.amount).toBe(expected.amount);
    expect(result.amount).toBe(Math.round(MONTHLY * (12 / 23)));
  });

  it('сумма двух выплат за февральский цикл ≈ оклад по долям месяцев', () => {
    const pay10 = calculateSalaryPaymentAmount(
      MONTHLY,
      10,
      PAY_10,
      DEFAULT_BIMONTHLY_TRANCHES,
    );
    const pay25 = calculateSalaryPaymentAmount(
      MONTHLY,
      25,
      PAY_25,
      DEFAULT_BIMONTHLY_TRANCHES,
    );

    // Доли от разных месяцев, поэтому сумма не обязана быть ровно 100000.
    expect(pay10.amount + pay25.amount).toBeGreaterThan(90_000);
    expect(pay10.amount + pay25.amount).toBeLessThan(110_000);
  });
});

describe('calculateSalaryPaymentAmount — кастомный график 5 и 20', () => {
  it('5-е: период 16–конец прошлого месяца', () => {
    const tranche = CUSTOM_5_20[0]!;
    const expected = expectedAmount(MONTHLY, PAY_5, tranche);
    const result = calculateSalaryPaymentAmount(
      MONTHLY,
      5,
      PAY_5,
      CUSTOM_5_20,
    );

    expect(result.periodLabel).toBe('16–31 января');
    expect(result.workingDays).toBe(expected.workingDays);
    expect(result.totalMonthWorkingDays).toBe(expected.monthDays);
    expect(result.amount).toBe(expected.amount);
  });

  it('20-е: период 1–15 текущего месяца', () => {
    const tranche = CUSTOM_5_20[1]!;
    const expected = expectedAmount(MONTHLY, PAY_20, tranche);
    const result = calculateSalaryPaymentAmount(
      MONTHLY,
      20,
      PAY_20,
      CUSTOM_5_20,
    );

    expect(result.periodLabel).toBe('1–15 февраля');
    expect(result.workingDays).toBe(expected.workingDays);
    expect(result.totalMonthWorkingDays).toBe(expected.monthDays);
    expect(result.amount).toBe(expected.amount);
  });

  it('без явных траншей fallback на 10/25', () => {
    const withDefault = calculateSalaryPaymentAmount(MONTHLY, 25, PAY_25);
    const explicit = calculateSalaryPaymentAmount(
      MONTHLY,
      25,
      PAY_25,
      DEFAULT_BIMONTHLY_TRANCHES,
    );
    expect(withDefault).toEqual(explicit);
  });
});
