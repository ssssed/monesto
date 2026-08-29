import {
  calculateSalaryPaymentAmount,
  DEFAULT_BIMONTHLY_TRANCHES,
  detectSalarySchedulePreset,
  getNextPrimaryPaymentDate,
  getNextSchedulePaymentDate,
  getUpcomingBimonthlyPayments,
  normalizeSalaryTranches,
  paymentDaysFromTranches,
  resolveTranchePeriodBounds,
} from './salary-schedule';

describe('salary-schedule', () => {
  it('normalizeSalaryTranches defaults to the 10/25 preset when null', () => {
    expect(normalizeSalaryTranches(null)).toEqual(DEFAULT_BIMONTHLY_TRANCHES);
  });

  it('normalizeSalaryTranches clamps out-of-range days', () => {
    const result = normalizeSalaryTranches([
      {
        paymentDay: 40,
        periodFromDay: -5,
        periodToDay: 50,
        periodMonthOffset: 1 as any,
      },
    ]);
    expect(result).toEqual([
      {
        paymentDay: 31,
        periodFromDay: 1,
        periodToDay: 31,
        periodMonthOffset: 0,
      },
    ]);
  });

  it('paymentDaysFromTranches returns unique sorted days', () => {
    expect(paymentDaysFromTranches(DEFAULT_BIMONTHLY_TRANCHES)).toEqual([
      10, 25,
    ]);
  });

  it('detectSalarySchedulePreset recognizes the default 10-25 preset', () => {
    expect(detectSalarySchedulePreset(DEFAULT_BIMONTHLY_TRANCHES)).toBe(
      '10-25',
    );
  });

  it('detectSalarySchedulePreset falls back to custom for arbitrary tranches', () => {
    expect(
      detectSalarySchedulePreset([
        {
          paymentDay: 15,
          periodFromDay: 1,
          periodToDay: 15,
          periodMonthOffset: 0,
        },
      ]),
    ).toBe('custom');
  });

  it('resolveTranchePeriodBounds clamps period days to a short February', () => {
    const { from, to } = resolveTranchePeriodBounds(
      new Date(2026, 1, 10), // Feb 2026 payment (10th tranche looks back to prev month 16-31)
      DEFAULT_BIMONTHLY_TRANCHES[0],
    );
    // periodMonthOffset -1 => January; 16..31 stays valid in January (31 days)
    expect(from.getMonth()).toBe(0);
    expect(from.getDate()).toBe(16);
    expect(to.getDate()).toBe(31);
  });

  it('resolveTranchePeriodBounds clamps the 25th tranche period to a short February', () => {
    const { from, to } = resolveTranchePeriodBounds(
      new Date(2026, 1, 25), // Feb 2026, tranche periodMonthOffset 0, days 1..15
      DEFAULT_BIMONTHLY_TRANCHES[1],
    );
    expect(from.getDate()).toBe(1);
    expect(to.getDate()).toBe(15);
  });

  it('calculateSalaryPaymentAmount pro-rates by working days in the period vs the month', () => {
    const result = calculateSalaryPaymentAmount(
      100_000,
      25,
      new Date(2026, 6, 25),
      DEFAULT_BIMONTHLY_TRANCHES,
    );
    expect(result.amount).toBe(
      Math.round(100_000 * (result.workingDays / result.totalMonthWorkingDays)),
    );
    expect(result.workingDays).toBeGreaterThan(0);
  });

  it('calculateSalaryPaymentAmount throws for an unknown payment day with no matching tranche', () => {
    expect(() =>
      calculateSalaryPaymentAmount(
        100_000,
        17,
        new Date(2026, 6, 17),
        DEFAULT_BIMONTHLY_TRANCHES,
      ),
    ).toThrow();
  });

  it('getNextPrimaryPaymentDate stays in the current month when today is on/before the payment day', () => {
    const next = getNextPrimaryPaymentDate(new Date(2026, 6, 5), 10);
    expect(next).toEqual(new Date(2026, 6, 10));
  });

  it('getNextPrimaryPaymentDate rolls to next month when today is after the payment day', () => {
    const next = getNextPrimaryPaymentDate(new Date(2026, 6, 15), 10);
    expect(next).toEqual(new Date(2026, 7, 10));
  });

  it('getNextSchedulePaymentDate wraps to the first schedule day of next month', () => {
    const next = getNextSchedulePaymentDate(new Date(2026, 6, 25), [10, 25]);
    expect(next).toEqual(new Date(2026, 7, 10));
  });

  it('getNextSchedulePaymentDate throws for an empty schedule', () => {
    expect(() =>
      getNextSchedulePaymentDate(new Date(2026, 6, 1), []),
    ).toThrow();
  });

  it('getUpcomingBimonthlyPayments enumerates all schedule days within range', () => {
    const payments = getUpcomingBimonthlyPayments(
      new Date(2026, 6, 1),
      new Date(2026, 6, 31),
      DEFAULT_BIMONTHLY_TRANCHES,
    );
    expect(payments.map((p) => p.paymentDay)).toEqual([10, 25]);
  });
});
