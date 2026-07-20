import { countWorkingDaysInMonth } from '@/lib/calendar/workingDays';
import {
  calculateSalaryPaymentAmount,
  getNextPrimaryPaymentDate,
  getSalaryWorkPeriod,
} from '@/lib/report/calculateSalaryPayment';

describe('calculateSalaryPayment', () => {
  it('maps July 10 payment to June 16–30 period', () => {
    const period = getSalaryWorkPeriod(new Date(2025, 6, 10));
    expect(period.from.getDate()).toBe(16);
    expect(period.from.getMonth()).toBe(5);
    expect(period.to.getDate()).toBe(30);
    expect(period.to.getMonth()).toBe(5);
    expect(period.label).toBe('16–30 июня');
  });

  it('maps July 25 payment to July 1–15 period', () => {
    const period = getSalaryWorkPeriod(new Date(2025, 6, 25));
    expect(period.from.getDate()).toBe(1);
    expect(period.to.getDate()).toBe(15);
    expect(period.label).toBe('1–15 июля');
  });

  it('maps August 10 payment to July 16–31 period', () => {
    const period = getSalaryWorkPeriod(new Date(2025, 7, 10));
    expect(period.from.getDate()).toBe(16);
    expect(period.from.getMonth()).toBe(6);
    expect(period.to.getDate()).toBe(31);
    expect(period.label).toBe('16–31 июля');
  });

  it('calculates July 25 payment from monthly salary', () => {
    const result = calculateSalaryPaymentAmount(100_000, 25, new Date(2025, 6, 25));
    expect(result.workingDays).toBe(11);
    expect(result.totalMonthWorkingDays).toBe(23);
    expect(result.amount).toBe(Math.round((100_000 * 11) / 23));
    expect(result.amount).toBe(47_826);
  });

  it('calculates July 10 payment for second half of June', () => {
    const result = calculateSalaryPaymentAmount(100_000, 10, new Date(2025, 6, 10));
    expect(result.workingDays).toBe(11);
    expect(result.totalMonthWorkingDays).toBe(21);
    expect(result.amount).toBe(52_381);
  });

  it('approximates monthly salary across both payments for the same work month', () => {
    const june25 = calculateSalaryPaymentAmount(100_000, 25, new Date(2025, 5, 25)).amount;
    const july10 = calculateSalaryPaymentAmount(100_000, 10, new Date(2025, 6, 10)).amount;
    expect(Math.abs(june25 + july10 - 100_000)).toBeLessThanOrEqual(2);
  });

  it('handles February second half correctly', () => {
    const period = getSalaryWorkPeriod(new Date(2025, 2, 10));
    expect(period.to.getDate()).toBe(28);
    expect(countWorkingDaysInMonth(2025, 1)).toBeGreaterThan(0);
  });

  it('handles months with 30 vs 31 days', () => {
    const april = getSalaryWorkPeriod(new Date(2025, 4, 10));
    expect(april.to.getDate()).toBe(30);
    const may = getSalaryWorkPeriod(new Date(2025, 5, 10));
    expect(may.to.getDate()).toBe(31);
  });

  it('finds next primary payment on 25th when today is July 20', () => {
    expect(getNextPrimaryPaymentDate(new Date(2025, 6, 20), 25)).toEqual(
      new Date(2025, 6, 25),
    );
  });

  it('rolls primary payment to next month after day passes', () => {
    expect(getNextPrimaryPaymentDate(new Date(2025, 6, 26), 25)).toEqual(
      new Date(2025, 7, 25),
    );
  });
});
