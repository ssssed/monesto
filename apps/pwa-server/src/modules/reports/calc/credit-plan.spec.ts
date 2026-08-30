import { CreditEarlyRepayMode } from '@prisma/client';
import {
  accruedInterestSinceDueDay,
  annuityPayment,
  applyEarlyRepayment,
  creditMonthsPaid,
  creditRepaidAmount,
  creditRepaidRatio,
  creditScheduleContext,
  exactMonthsLeftWithInterest,
  hasCreditInterest,
  isExistingCreditLoan,
  principalFromEarlyPayment,
  resolveCreditPayment,
  resolveRemainingMonthsForRecalc,
  roundMoney,
  scheduleMonthsForPaymentRecalc,
} from './credit-plan';
import type { AssetCalc, ExpenseCalc } from './types';

const creditAsset: AssetCalc = {
  id: 1,
  name: 'Кредит',
  provider: 'credit',
  goalAmount: 1_000_000,
  currentAmount: 800_000,
  icon: 'i',
  bgColor: '#fff',
  iconColor: '#000',
  costBasisRub: 0,
  linkedExpenseId: 5,
  creditAnnualRate: 19.9,
  creditTermMonths: 60,
  creditStartDate: '2026-01-15',
  creditRemainingMonths: null,
  creditEarlyRepayMode: null,
};

describe('roundMoney', () => {
  it('rounds to kopecks', () => {
    expect(roundMoney(1.005)).toBeCloseTo(1.0, 2);
    expect(roundMoney(1.006)).toBeCloseTo(1.01, 2);
  });
});

describe('creditRepaidRatio / creditRepaidAmount', () => {
  it('returns null ratio without a goal amount', () => {
    expect(creditRepaidRatio({ ...creditAsset, goalAmount: null })).toBeNull();
  });

  it('computes repaid ratio and amount from goal vs current', () => {
    expect(creditRepaidRatio(creditAsset)).toBeCloseTo(0.2, 5);
    expect(creditRepaidAmount(creditAsset)).toBe(200_000);
  });
});

describe('hasCreditInterest', () => {
  it('is false for a zero/absent rate', () => {
    expect(hasCreditInterest({ ...creditAsset, creditAnnualRate: null })).toBe(
      false,
    );
    expect(hasCreditInterest({ ...creditAsset, creditAnnualRate: 0 })).toBe(
      false,
    );
  });

  it('is true for a positive rate on a credit asset', () => {
    expect(hasCreditInterest(creditAsset)).toBe(true);
  });
});

describe('annuityPayment', () => {
  it('degrades to a simple even split when there is no interest', () => {
    expect(annuityPayment(120_000, 0, 12)).toBe(10_000);
  });

  it('returns 0 for non-positive principal/term', () => {
    expect(annuityPayment(0, 10, 12)).toBe(0);
    expect(annuityPayment(1000, 10, 0)).toBe(0);
  });
});

describe('creditMonthsPaid', () => {
  it('counts the first payment as the month after issuance', () => {
    // issued 2026-01-15, paymentDay 10 <= issuance day 15 -> first payment pushed to March
    const paid = creditMonthsPaid({
      startDate: '2026-01-15',
      paymentDay: 10,
      asOf: new Date(2026, 2, 10), // 2026-03-10
    });
    expect(paid).toBe(1);
  });

  it('returns 0 before any scheduled payment date has occurred', () => {
    const paid = creditMonthsPaid({
      startDate: '2026-01-15',
      paymentDay: 10,
      asOf: new Date(2026, 1, 1), // before March 10
    });
    expect(paid).toBe(0);
  });
});

describe('isExistingCreditLoan', () => {
  it('is false for a loan issued less than a month ago', () => {
    expect(isExistingCreditLoan('2026-07-01', new Date(2026, 6, 15))).toBe(
      false,
    );
  });

  it('is true for a loan issued more than a month ago', () => {
    expect(isExistingCreditLoan('2026-01-01', new Date(2026, 6, 15))).toBe(
      true,
    );
  });

  it('is false without a start date', () => {
    expect(isExistingCreditLoan(null, new Date())).toBe(false);
  });
});

describe('exactMonthsLeftWithInterest', () => {
  it('returns null when the payment does not even cover interest', () => {
    // monthly rate = 19.9/100/12 ≈ 0.01658; interest-only on 800000 ≈ 13267
    expect(exactMonthsLeftWithInterest(800_000, 10_000, 19.9)).toBeNull();
  });

  it('returns a positive fractional term for a sufficient payment', () => {
    const months = exactMonthsLeftWithInterest(800_000, 25_000, 19.9);
    expect(months).not.toBeNull();
    expect(months!).toBeGreaterThan(0);
  });
});

describe('scheduleMonthsForPaymentRecalc (bank-specific heuristic)', () => {
  it('matches the cited real-world example: ~51 months', () => {
    const months = scheduleMonthsForPaymentRecalc(
      1_206_338.93,
      34_736.67,
      19.9,
    );
    expect(months).toBe(51);
  });
});

describe('resolveRemainingMonthsForRecalc', () => {
  it('prefers the issuance schedule when available and positive', () => {
    const months = resolveRemainingMonthsForRecalc(800_000, 25_000, 19.9, 40, {
      startDate: '2026-01-15',
      termMonths: 60,
      paymentDay: 10,
      asOf: new Date(2026, 6, 1),
    });
    expect(months).toBeGreaterThan(0);
  });

  it('falls back to storedRemaining when there is no schedule', () => {
    expect(
      resolveRemainingMonthsForRecalc(800_000, 25_000, 19.9, 45, null),
    ).toBe(45);
  });

  it('falls back to the NPER heuristic when neither schedule nor stored value exist', () => {
    const months = resolveRemainingMonthsForRecalc(
      1_206_338.93,
      34_736.67,
      19.9,
      null,
      null,
    );
    expect(months).toBe(51);
  });
});

describe('applyEarlyRepayment', () => {
  const base = {
    remainingDebt: 800_000,
    extraPayment: 100_000,
    monthlyPayment: 25_000,
    annualPercent: 19.9,
    remainingMonths: 40,
    onDate: new Date(2026, 6, 15),
  };

  it('reduce_term keeps the payment fixed and recomputes months left', () => {
    const result = applyEarlyRepayment({
      ...base,
      mode: CreditEarlyRepayMode.reduce_term,
    });
    expect(result.newPayment).toBe(base.monthlyPayment);
    expect(result.newDebt).toBeLessThan(base.remainingDebt);
    expect(result.newMonthsLeft).not.toBeNull();
  });

  it('reduce_payment keeps the term and recomputes a smaller payment', () => {
    const result = applyEarlyRepayment({
      ...base,
      mode: CreditEarlyRepayMode.reduce_payment,
    });
    expect(result.newMonthsLeft).toBe(40);
    expect(result.newPayment).toBeLessThan(base.monthlyPayment);
  });

  it('fully closes the loan when the payment exceeds the remaining debt', () => {
    const result = applyEarlyRepayment({
      ...base,
      extraPayment: 10_000_000,
      mode: CreditEarlyRepayMode.reduce_term,
    });
    expect(result.newDebt).toBe(0);
    expect(result.newPayment).toBe(0);
    expect(result.newMonthsLeft).toBe(0);
  });
});

describe('resolveCreditPayment', () => {
  const expenses: ExpenseCalc[] = [
    {
      id: 5,
      name: 'Credit payment',
      currency: 'rub',
      amount: 25_000,
      recurrence: 'monthly',
      dueDay: 10,
      specificDate: null,
      linkedAssetId: null,
    },
  ];

  it('resolves via asset.linkedExpenseId first', () => {
    const result = resolveCreditPayment(creditAsset, expenses);
    expect(result.expense?.id).toBe(5);
    expect(result.amount).toBe(25_000);
    expect(result.dueDay).toBe(10);
  });

  it('falls back to scanning expenses by linkedAssetId when the asset has no linkedExpenseId', () => {
    const assetWithoutLink = { ...creditAsset, linkedExpenseId: null };
    const expensesLinkingBack: ExpenseCalc[] = [
      { ...expenses[0], id: 9, linkedAssetId: creditAsset.id },
    ];
    const result = resolveCreditPayment(assetWithoutLink, expensesLinkingBack);
    expect(result.expense?.id).toBe(9);
  });

  it('returns zeroed result when no linked expense is found', () => {
    const result = resolveCreditPayment(
      { ...creditAsset, linkedExpenseId: null },
      [],
    );
    expect(result).toEqual({ amount: 0, dueDay: null, expense: null });
  });
});

describe('accruedInterestSinceDueDay / principalFromEarlyPayment', () => {
  it('accrues 0 with no rate or no due day', () => {
    expect(
      accruedInterestSinceDueDay({
        remainingDebt: 800_000,
        annualPercent: 0,
        dueDay: 10,
        onDate: new Date(2026, 6, 15),
      }),
    ).toBe(0);
  });

  it('accrues a positive amount for days since the last due date', () => {
    const accrued = accruedInterestSinceDueDay({
      remainingDebt: 800_000,
      annualPercent: 19.9,
      dueDay: 10,
      onDate: new Date(2026, 6, 15),
    });
    expect(accrued).toBeGreaterThan(0);
  });

  it('principalFromEarlyPayment subtracts accrued interest from the extra payment', () => {
    const { accrued, toPrincipal } = principalFromEarlyPayment({
      remainingDebt: 800_000,
      extraPayment: 10_000,
      annualPercent: 19.9,
      dueDay: 10,
      onDate: new Date(2026, 6, 15),
    });
    expect(toPrincipal).toBe(roundMoney(10_000 - accrued));
  });

  it('principalFromEarlyPayment never goes negative when accrued exceeds the payment', () => {
    const { toPrincipal } = principalFromEarlyPayment({
      remainingDebt: 800_000,
      extraPayment: 1,
      annualPercent: 19.9,
      dueDay: 10,
      onDate: new Date(2026, 6, 15),
    });
    expect(toPrincipal).toBe(0);
  });
});

describe('creditScheduleContext', () => {
  it('returns null when required fields are missing', () => {
    expect(
      creditScheduleContext(
        { ...creditAsset, creditTermMonths: null },
        10,
        new Date(),
      ),
    ).toBeNull();
    expect(creditScheduleContext(creditAsset, null, new Date())).toBeNull();
  });

  it('bundles the schedule fields when everything is present', () => {
    const ctx = creditScheduleContext(creditAsset, 10, new Date(2026, 6, 1));
    expect(ctx).toEqual({
      startDate: '2026-01-15',
      termMonths: 60,
      paymentDay: 10,
      asOf: new Date(2026, 6, 1),
    });
  });
});
