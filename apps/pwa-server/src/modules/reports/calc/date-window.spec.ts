import {
  clampIncomeStart,
  expandExpensesToLines,
  expandIncomeToLines,
  findPreviousReportCycle,
  findPrimaryIncome,
  listReportCycles,
  parseDate,
  resolveExpenseEndExclusive,
  resolveReportCycle,
  resolveReportWindow,
  scheduleDaysFromPrimary,
} from './date-window';
import { DEFAULT_BIMONTHLY_TRANCHES } from './salary-schedule';
import type {
  ExpenseCalc,
  IncomeSourceCalc,
  VacationPeriodCalc,
} from './types';

function income(overrides: Partial<IncomeSourceCalc>): IncomeSourceCalc {
  return {
    id: 1,
    name: 'Salary',
    currency: 'rub',
    incomeKind: 'fixed',
    amount: null,
    monthlyAmount: null,
    isOneTime: false,
    recurrence: 'monthly',
    paymentDay: null,
    isPrimary: false,
    primaryPaymentDay: null,
    specificDate: null,
    salaryTranches: null,
    ...overrides,
  };
}

function expense(overrides: Partial<ExpenseCalc>): ExpenseCalc {
  return {
    id: 1,
    name: 'Rent',
    currency: 'rub',
    amount: 1000,
    recurrence: 'monthly',
    dueDay: null,
    specificDate: null,
    linkedAssetId: null,
    ...overrides,
  };
}

describe('parseDate', () => {
  it('parses a YYYY-MM-DD string as a local calendar date', () => {
    const date = parseDate('2026-07-15');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(15);
  });
});

describe('findPrimaryIncome / scheduleDaysFromPrimary', () => {
  it('finds the income flagged as primary', () => {
    const incomes = [income({ id: 1 }), income({ id: 2, isPrimary: true })];
    expect(findPrimaryIncome(incomes)?.id).toBe(2);
  });

  it('derives schedule days from bimonthly tranches', () => {
    const primary = income({
      incomeKind: 'bimonthly_salary',
      salaryTranches: DEFAULT_BIMONTHLY_TRANCHES,
    });
    expect(scheduleDaysFromPrimary(primary)).toEqual([10, 25]);
  });

  it('derives a single schedule day from a fixed payment day', () => {
    const primary = income({ paymentDay: 5 });
    expect(scheduleDaysFromPrimary(primary)).toEqual([5]);
  });

  it('defaults to 10/25 with no primary income at all', () => {
    expect(scheduleDaysFromPrimary(undefined)).toEqual([10, 25]);
  });
});

describe('resolveReportWindow (single payment day)', () => {
  it('stays in the current month when today is on/before the payment day', () => {
    const window = resolveReportWindow(new Date(2026, 6, 5), 10, [10]);
    expect(window.incomeDate).toEqual(new Date(2026, 6, 10));
  });

  it('rolls to next month when today is after the payment day', () => {
    const window = resolveReportWindow(new Date(2026, 6, 15), 10, [10]);
    expect(window.incomeDate).toEqual(new Date(2026, 7, 10));
  });
});

describe('clampIncomeStart', () => {
  it('is a no-op for a single-day schedule', () => {
    const candidate = new Date(2026, 6, 1);
    expect(clampIncomeStart(candidate, new Date(2026, 6, 10), [10])).toEqual(
      candidate,
    );
  });

  it('clamps forward past the previous schedule payment date for multi-day schedules', () => {
    // incomeDate = 25th; previous schedule date = 10th; candidate before the 10th
    // should be pulled forward to the 11th to avoid double-counting the 10th's payout
    const clamped = clampIncomeStart(
      new Date(2026, 6, 5),
      new Date(2026, 6, 25),
      [10, 25],
    );
    expect(clamped).toEqual(new Date(2026, 6, 11));
  });
});

describe('resolveReportCycle', () => {
  it('shifts a weekend nominal date to the preceding working day for payout', () => {
    // today is between the two schedule days -> this month's "later" (25th) anchor;
    // 2026-07-25 is a Saturday, so payout shifts back to Friday the 24th.
    const cycle = resolveReportCycle(new Date(2026, 6, 15), 25, [10, 25]);
    expect(cycle.nominalDate).toEqual(new Date(2026, 6, 25));
    expect(cycle.payoutDate).toEqual(new Date(2026, 6, 24));
    expect(cycle.payoutDate.getDay()).not.toBe(0);
    expect(cycle.payoutDate.getDay()).not.toBe(6);
  });

  it('marks a future cycle as preview', () => {
    const cycle = resolveReportCycle(new Date(2026, 6, 15), 25, [10, 25]);
    expect(cycle.isPreview).toBe(true);
  });

  it('marks a past cycle as not preview', () => {
    const cycle = resolveReportCycle(new Date(2026, 6, 26), 25, [10, 25]);
    expect(cycle.isPreview).toBe(false);
  });
});

describe('resolveExpenseEndExclusive with vacation absorption', () => {
  const tranches = DEFAULT_BIMONTHLY_TRANCHES;

  it('returns the plain next schedule payout with no vacation context', () => {
    // 2026-07-25 is a Saturday -> shifted back to Friday the 24th
    const end = resolveExpenseEndExclusive(new Date(2026, 6, 10), [10, 25]);
    expect(end).toEqual(new Date(2026, 6, 24));
  });

  it('skips over a cycle fully absorbed by vacation (zero salary and zero vacation pay)', () => {
    // A vacation spanning the entire July period should zero out the July 25th
    // salary tranche AND not create a vacation payout landing on that exact date,
    // pushing expenseEndExclusive to the next non-empty cycle.
    const vacations: VacationPeriodCalc[] = [
      { id: 1, startDate: '2026-07-01', endDate: '2026-07-31' },
    ];
    const end = resolveExpenseEndExclusive(new Date(2026, 6, 10), [10, 25], {
      vacations,
      monthlyAmount: 100_000,
      tranches,
    });
    // Should not silently return the empty 07-25 cycle
    expect(end.getTime()).toBeGreaterThan(new Date(2026, 6, 25).getTime());
  });
});

describe('listReportCycles', () => {
  it('returns one cycle per schedule day, sorted by payout date', () => {
    const cycles = listReportCycles(new Date(2026, 6, 1), [10, 25]);
    expect(cycles).toHaveLength(2);
    expect(cycles[0].payoutDate.getTime()).toBeLessThan(
      cycles[1].payoutDate.getTime(),
    );
  });
});

describe('expandIncomeToLines', () => {
  it('expands a fixed-day income into one line per matching month', () => {
    const lines = expandIncomeToLines(
      [income({ paymentDay: 10, amount: 50_000 })],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      new Date(2026, 6, 1),
      [],
      82,
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      kind: 'fixed_day',
      nativeAmount: 50_000,
      amountRub: 50_000,
      paymentDay: 10,
    });
  });

  it('converts usd income to rub and keeps the native amount separately', () => {
    const lines = expandIncomeToLines(
      [income({ paymentDay: 10, amount: 1000, currency: 'usd' })],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      new Date(2026, 6, 1),
      [],
      82,
    );
    expect(lines[0]).toMatchObject({ nativeAmount: 1000, amountRub: 82_000 });
  });

  it('only includes a one-time income whose specificDate falls in the window', () => {
    const inWindow = income({
      recurrence: 'one_time',
      specificDate: '2026-07-15',
      amount: 5000,
    });
    const outOfWindow = income({
      id: 2,
      recurrence: 'one_time',
      specificDate: '2026-08-01',
      amount: 5000,
    });
    const lines = expandIncomeToLines(
      [inWindow, outOfWindow],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      new Date(2026, 6, 1),
      [],
      82,
    );
    expect(lines).toHaveLength(1);
    expect(lines[0].paymentDate).toBe('2026-07-15');
  });

  it('skips bimonthly payments that pro-rate to zero or less', () => {
    const primary = income({
      incomeKind: 'bimonthly_salary',
      monthlyAmount: 100_000,
      salaryTranches: DEFAULT_BIMONTHLY_TRANCHES,
    });
    // Whole-month vacation zeroes out both tranches for July
    const vacations: VacationPeriodCalc[] = [
      { id: 1, startDate: '2026-06-16', endDate: '2026-07-15' },
    ];
    const lines = expandIncomeToLines(
      [primary],
      new Date(2026, 6, 1),
      new Date(2026, 6, 25),
      new Date(2026, 6, 1),
      vacations,
      82,
    );
    const salaryLines = lines.filter((l) => l.kind === 'bimonthly_salary');
    for (const line of salaryLines) {
      expect(line.nativeAmount).toBeGreaterThan(0);
    }
  });

  it('emits a vacation_payout line separate from salary lines', () => {
    const primary = income({
      incomeKind: 'bimonthly_salary',
      monthlyAmount: 100_000,
      salaryTranches: DEFAULT_BIMONTHLY_TRANCHES,
    });
    const vacations: VacationPeriodCalc[] = [
      { id: 7, startDate: '2026-07-20', endDate: '2026-07-25' },
    ];
    const lines = expandIncomeToLines(
      [primary],
      new Date(2026, 6, 1),
      new Date(2026, 6, 25),
      new Date(2026, 6, 1),
      vacations,
      82,
    );
    const vacationLine = lines.find((l) => l.kind === 'vacation_payout');
    expect(vacationLine?.vacationId).toBe(7);
  });

  it('with oneTimeRange, clamps a one-time income to [start, endExclusive)', () => {
    const withinRange = income({
      id: 1,
      recurrence: 'one_time',
      specificDate: '2026-07-25',
      amount: 3000,
    });
    const onEndExclusive = income({
      id: 2,
      recurrence: 'one_time',
      specificDate: '2026-08-25',
      amount: 3000,
    });
    const lines = expandIncomeToLines(
      [withinRange, onEndExclusive],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      new Date(2026, 6, 1),
      [],
      82,
      { start: new Date(2026, 6, 25), endExclusive: new Date(2026, 7, 25) },
    );
    expect(lines).toHaveLength(1);
    expect(lines[0].paymentDate).toBe('2026-07-25');
  });

  it('with oneTimeRange, excludes a one-time income before the range start', () => {
    const before = income({
      recurrence: 'one_time',
      specificDate: '2026-07-01',
      amount: 3000,
    });
    const lines = expandIncomeToLines(
      [before],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      new Date(2026, 6, 1),
      [],
      82,
      { start: new Date(2026, 6, 25), endExclusive: new Date(2026, 7, 25) },
    );
    expect(lines).toHaveLength(0);
  });
});

describe('findPreviousReportCycle', () => {
  it('returns the previous cycle for a single payment day', () => {
    const today = new Date(2026, 6, 26);
    const prev = findPreviousReportCycle(today, new Date(2026, 7, 25), [25]);
    expect(prev).not.toBeNull();
    expect(prev?.nominalDate).toEqual(new Date(2026, 6, 25));
  });

  it('resolves a previous cycle strictly before the given date when a vacation context is present', () => {
    const today = new Date(2026, 8, 1);
    const primary = income({
      incomeKind: 'bimonthly_salary',
      monthlyAmount: 100_000,
      salaryTranches: DEFAULT_BIMONTHLY_TRANCHES,
      isPrimary: true,
    });
    const vacations: VacationPeriodCalc[] = [
      { id: 1, startDate: '2026-07-01', endDate: '2026-07-31' },
    ];
    const scheduleDays = scheduleDaysFromPrimary(primary);
    const beforeDate = new Date(2026, 7, 25);
    const prev = findPreviousReportCycle(today, beforeDate, scheduleDays, {
      vacations,
      monthlyAmount: 100_000,
      tranches: primary.salaryTranches,
    });
    expect(prev).not.toBeNull();
    expect(prev!.nominalDate.getTime()).toBeLessThan(beforeDate.getTime());
  });
});

describe('expandExpensesToLines', () => {
  it('includes a recurring expense whose due date falls in [start, end)', () => {
    const lines = expandExpensesToLines(
      [expense({ dueDay: 15, amount: 3000 })],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      82,
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      kind: 'recurring',
      dueDate: '2026-07-15',
      amountRub: 3000,
    });
  });

  it('excludes an expense due exactly on the exclusive end date', () => {
    const lines = expandExpensesToLines(
      [expense({ dueDay: 31, amount: 3000 })],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31), // exclusive end == the due date
      82,
    );
    expect(lines).toHaveLength(0);
  });

  it('includes a one-time expense on its specific date', () => {
    const lines = expandExpensesToLines(
      [
        expense({
          recurrence: 'one_time',
          specificDate: '2026-07-10',
          amount: 500,
        }),
      ],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      82,
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ kind: 'one_time', dueDate: '2026-07-10' });
  });
});
