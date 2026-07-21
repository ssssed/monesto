import {
  expandExpensesToLines,
  expandIncomeToLines,
  listReportCycles,
  resolveReportCycle,
  resolveReportWindow,
  resolveTargetDate,
} from '@/lib/report/dateWindow';
import type { Expense, IncomeSource } from '@/lib/types';

const bimonthlyPrimary: IncomeSource = {
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

describe('dateWindow', () => {
  it('sets target date to July 25 when today is July 20', () => {
    expect(resolveTargetDate(new Date(2025, 6, 20), 25)).toEqual(new Date(2025, 6, 25));
  });

  it('keeps July 25 cycle when today is July 26 (until next 10th)', () => {
    const window = resolveReportWindow(new Date(2025, 6, 26), 25);
    expect(window.incomeDate).toEqual(new Date(2025, 6, 25));
    expect(window.expenseEndExclusive).toEqual(new Date(2025, 7, 10));
  });

  it('keeps July 25 cycle when today is August 5', () => {
    const window = resolveReportWindow(new Date(2025, 7, 5), 25);
    expect(window.incomeDate).toEqual(new Date(2025, 6, 25));
    expect(window.expenseEndExclusive).toEqual(new Date(2025, 7, 10));
  });

  it('starts August 25 cycle on August 10', () => {
    const window = resolveReportWindow(new Date(2025, 7, 10), 25);
    expect(window.incomeDate).toEqual(new Date(2025, 7, 25));
    expect(window.expenseEndExclusive).toEqual(new Date(2025, 8, 10));
  });

  it('expense window for July 20 includes day 30 and excludes next 10th', () => {
    const window = resolveReportWindow(new Date(2025, 6, 20), 25);
    expect(window.incomeDate).toEqual(new Date(2025, 6, 25));
    expect(window.expenseEndExclusive).toEqual(new Date(2025, 7, 10));

    const expenses: Expense[] = [
      { id: 1, name: 'Кредит', amount: 35_000, recurrence: 'monthly', due_day: 30, specific_date: null },
      { id: 2, name: 'Аренда', amount: 10_000, recurrence: 'monthly', due_day: 10, specific_date: null },
    ];

    const lines = expandExpensesToLines(
      expenses,
      new Date(2025, 6, 20),
      window.expenseEndExclusive,
    );
    expect(lines.some((line) => line.name === 'Кредит')).toBe(true);
    // 10 августа не включительно — аренда 10-го следующего месяца не входит;
    // но 10 июля уже прошло — в окне от 20 июля аренда 10 августа не входит
    expect(lines.some((line) => line.name === 'Аренда')).toBe(false);
  });

  it('includes monthly income on day 15 but not day 30 before income date 25', () => {
    const incomes: IncomeSource[] = [
      bimonthlyPrimary,
      {
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
      },
      {
        id: 3,
        name: 'Бонус',
        income_kind: 'fixed',
        amount: 5_000,
        monthly_amount: null,
        is_one_time: false,
        recurrence: 'monthly',
        payment_day: 30,
        is_primary: false,
        primary_payment_day: null,
        specific_date: null,
      },
    ];

    const lines = expandIncomeToLines(incomes, new Date(2025, 6, 10), new Date(2025, 6, 25));
    expect(lines.some((line) => line.name === 'Стипендия')).toBe(true);
    expect(lines.some((line) => line.name === 'Бонус')).toBe(false);
  });

  it('includes one-time income only inside the income window', () => {
    const incomes: IncomeSource[] = [
      bimonthlyPrimary,
      {
        id: 2,
        name: 'Премия',
        income_kind: 'fixed',
        amount: 20_000,
        monthly_amount: null,
        is_one_time: true,
        recurrence: 'one_time',
        payment_day: null,
        is_primary: false,
        primary_payment_day: null,
        specific_date: '2025-07-22',
      },
    ];

    const included = expandIncomeToLines(
      incomes,
      new Date(2025, 6, 20),
      new Date(2025, 6, 25),
    );
    expect(included.some((line) => line.name === 'Премия')).toBe(true);

    const excluded = expandIncomeToLines(
      incomes,
      new Date(2025, 6, 23),
      new Date(2025, 6, 25),
    );
    expect(excluded.some((line) => line.name === 'Премия')).toBe(false);
  });

  it('includes expense on day 28 when expense window extends past 25 to next 10', () => {
    const expenses: Expense[] = [
      { id: 1, name: 'Кредит', amount: 35_000, recurrence: 'monthly', due_day: 20, specific_date: null },
      { id: 2, name: 'Курсы', amount: 10_000, recurrence: 'monthly', due_day: 28, specific_date: null },
    ];

    const window = resolveReportWindow(new Date(2025, 6, 20), 25);
    const lines = expandExpensesToLines(
      expenses,
      new Date(2025, 6, 20),
      window.expenseEndExclusive,
    );
    expect(lines.some((line) => line.name === 'Кредит')).toBe(true);
    expect(lines.some((line) => line.name === 'Курсы')).toBe(true);
  });

  it('includes both July bimonthly payments when today is July 5 and target is July 25', () => {
    const lines = expandIncomeToLines(
      [bimonthlyPrimary],
      new Date(2025, 6, 5),
      new Date(2025, 6, 25),
    );
    expect(lines).toHaveLength(2);
  });

  it('lists both 10 and 25 cycles for mid-month today', () => {
    const cycles = listReportCycles(new Date(2025, 6, 21));
    expect(cycles).toHaveLength(2);
    expect(cycles[0]?.paymentDay).toBe(10);
    expect(cycles[0]?.isPreview).toBe(false);
    expect(cycles[0]?.nominalDate).toEqual(new Date(2025, 6, 10));
    expect(cycles[1]?.paymentDay).toBe(25);
    expect(cycles[1]?.isPreview).toBe(true);
    expect(cycles[1]?.nominalDate).toEqual(new Date(2025, 6, 25));
  });

  it('marks preview expense start at payout date', () => {
    const cycle = resolveReportCycle(new Date(2025, 6, 21), 25);
    expect(cycle.isPreview).toBe(true);
    expect(cycle.expenseStart).toEqual(cycle.payoutDate);
  });
});
