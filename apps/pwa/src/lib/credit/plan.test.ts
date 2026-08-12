import { describe, expect, it } from 'vitest';

import {
  annuityPayment,
  applyEarlyRepayment,
  buildCreditClosingPlan,
  contractualAnnuityPayment,
  creditMonthsLeft,
  creditMonthsPaid,
  creditRemainingMonthsFromSchedule,
  creditRepaidRatio,
  isExistingCreditLoan,
  scheduleMonthsForPaymentRecalc,
} from './plan';
import type { Asset } from '../types';

const credit = (partial: Partial<Asset>): Asset => ({
  id: 1,
  name: 'Ипотека',
  provider: 'credit',
  purpose: null,
  goal_amount: 1_000_000,
  current_amount: 800_000,
  steam_inventory_url: null,
  icon: 'card',
  bg_color: '#FEF2F2',
  icon_color: '#991B1B',
  cost_basis_rub: 0,
  linked_expense_id: null,
  credit_annual_rate: null,
  credit_term_months: null,
  credit_start_date: null,
  credit_remaining_months: null,
  credit_early_repay_mode: null,
  ...partial,
});

describe('credit plan', () => {
  it('считает долю погашения', () => {
    expect(creditRepaidRatio(credit({}))).toBeCloseTo(0.2);
    expect(creditRepaidRatio(credit({ goal_amount: null }))).toBeNull();
  });

  it('считает месяцы до закрытия без процентов', () => {
    expect(creditMonthsLeft(100_000, 10_000)).toBe(10);
    expect(creditMonthsLeft(100_000, 0)).toBeNull();
  });

  it('строит наивный план закрытия', () => {
    const steps = buildCreditClosingPlan({
      remainingDebt: 25_000,
      monthlyPayment: 10_000,
      paymentDay: 10,
      from: new Date(2026, 0, 5),
      steps: 6,
    });
    expect(steps).toHaveLength(3);
    expect(steps[0]?.payment).toBe(10_000);
    expect(steps[0]?.interest).toBe(0);
    expect(steps[2]?.balanceAfter).toBe(0);
  });

  it('аннуитет считается от исходного долга, не от остатка', () => {
    const fromInitial = contractualAnnuityPayment({
      initialDebt: 1_500_000,
      annualPercent: 19.9,
      termMonths: 60,
    });
    const fromRemaining = annuityPayment(1_206_338.93, 19.9, 60);
    expect(fromInitial).toBeCloseTo(39_657.41, 0);
    expect(fromRemaining).toBeCloseTo(31_893.52, 0);
    expect(fromInitial).toBeGreaterThan(fromRemaining);
  });

  it('считает прошедшие и оставшиеся месяцы по дате выдачи', () => {
    const paid = creditMonthsPaid({
      startDate: '2025-11-22',
      paymentDay: 10,
      asOf: new Date(2026, 7, 12),
    });
    expect(paid).toBe(8);
    const remaining = creditRemainingMonthsFromSchedule({
      startDate: '2025-11-22',
      termMonths: 60,
      paymentDay: 10,
      asOf: new Date(2026, 7, 12),
    });
    expect(remaining).toBe(52);
    expect(isExistingCreditLoan('2025-11-22', new Date(2026, 7, 12))).toBe(true);
  });

  it('сокращение срока уменьшает NPER-месяцы', () => {
    const debt = 1_206_338.93;
    const payment = 34_736.67;
    const rate = 19.9;
    const before = scheduleMonthsForPaymentRecalc(debt, payment, rate);
    expect(before).toBe(51);
    const after = applyEarlyRepayment({
      remainingDebt: debt,
      extraPayment: 30_000,
      monthlyPayment: payment,
      annualPercent: rate,
      mode: 'reduce_term',
      remainingMonths: before ?? 1,
      dueDay: 3,
      onDate: new Date(2026, 7, 12),
    });
    expect(after.newMonthsLeft).not.toBeNull();
    expect(after.newMonthsLeft!).toBeLessThan(52);
    expect(after.newMonthsLeft!).toBeGreaterThan(0);
  });

  it('пример из банка: снижение платежа на 30 000', () => {
    const debt = 1_206_338.93;
    const payment = 34_736.67;
    const rate = 19.9;
    const extra = 30_000;

    expect(scheduleMonthsForPaymentRecalc(debt, payment, rate)).toBe(51);

    const onPaymentDay = applyEarlyRepayment({
      remainingDebt: debt,
      extraPayment: extra,
      monthlyPayment: payment,
      annualPercent: rate,
      mode: 'reduce_payment',
      remainingMonths: 51,
      dueDay: 4,
      onDate: new Date(2026, 7, 4),
    });
    expect(onPaymentDay.newPayment).toBeCloseTo(34_357.88, 1);

    const nextDay = applyEarlyRepayment({
      remainingDebt: debt,
      extraPayment: extra,
      monthlyPayment: payment,
      annualPercent: rate,
      mode: 'reduce_payment',
      remainingMonths: 51,
      dueDay: 3,
      onDate: new Date(2026, 7, 4),
    });
    expect(nextDay.newPayment).toBeCloseTo(34_376.72, 0);
  });
});
