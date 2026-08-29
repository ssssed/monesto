import {
  computeYearSummary,
  resolveYearSummaryTone,
  yearBaselineBalance,
} from './year-summary';
import type { AssetCalc, AssetTransactionCalc } from './types';

function asset(overrides: Partial<AssetCalc>): AssetCalc {
  return {
    id: 1,
    name: 'Sber',
    provider: 'rub',
    goalAmount: null,
    currentAmount: 0,
    icon: 'i',
    bgColor: '#fff',
    iconColor: '#000',
    costBasisRub: 0,
    linkedExpenseId: null,
    creditAnnualRate: null,
    creditTermMonths: null,
    creditStartDate: null,
    creditRemainingMonths: null,
    creditEarlyRepayMode: null,
    ...overrides,
  };
}

function tx(overrides: Partial<AssetTransactionCalc>): AssetTransactionCalc {
  return { assetId: 1, amountDelta: 0, createdAt: new Date(), ...overrides };
}

describe('resolveYearSummaryTone', () => {
  it('classifies growth/decline/stable around the epsilon threshold', () => {
    expect(resolveYearSummaryTone(500)).toBe('growth');
    expect(resolveYearSummaryTone(-500)).toBe('decline');
    expect(resolveYearSummaryTone(50)).toBe('stable');
  });
});

describe('yearBaselineBalance', () => {
  it('uses the balance at Jan 1 for an asset that existed before the year', () => {
    const asset1 = asset({ currentAmount: 1000 });
    const transactions = [
      tx({ createdAt: new Date(2025, 5, 1), amountDelta: 500 }), // before year start
      tx({ createdAt: new Date(2026, 2, 1), amountDelta: 500 }), // during the year
    ];
    const baseline = yearBaselineBalance(
      asset1,
      transactions,
      new Date(2026, 0, 1),
    );
    expect(baseline).toBe(500); // 1000 - the 500 that happened during 2026
  });

  it('uses the balance right after creation for an asset opened during the year', () => {
    const asset1 = asset({ currentAmount: 1200 });
    const transactions = [
      tx({ createdAt: new Date(2026, 3, 1), amountDelta: 1000 }), // opening deposit
      tx({ createdAt: new Date(2026, 5, 1), amountDelta: 200 }),
    ];
    const baseline = yearBaselineBalance(
      asset1,
      transactions,
      new Date(2026, 0, 1),
    );
    expect(baseline).toBe(1000); // not 0 — baseline is right after the opening deposit
  });
});

describe('computeYearSummary', () => {
  it('excludes credit assets from the savings set', () => {
    const summary = computeYearSummary({
      assets: [asset({ id: 1, provider: 'credit', currentAmount: 500_000 })],
      transactions: [],
      usdRubRate: 82,
      now: new Date(2026, 6, 1),
    });
    expect(summary.savingsCount).toBe(0);
    expect(summary.totalNowRub).toBe(0);
  });

  it('converts usd assets to rub using the given rate', () => {
    const summary = computeYearSummary({
      assets: [asset({ id: 1, provider: 'usd', currentAmount: 100 })],
      transactions: [],
      usdRubRate: 90,
      now: new Date(2026, 6, 1),
    });
    expect(summary.totalNowRub).toBe(9000);
  });

  it('derives tone from the total delta and sorts assets by |delta| descending', () => {
    const summary = computeYearSummary({
      assets: [
        asset({ id: 1, name: 'small', currentAmount: 1100 }),
        asset({ id: 2, name: 'big', currentAmount: 5000 }),
      ],
      transactions: [
        // an earlier tx (before year start) establishes each asset "existed before
        // the year", so the 2026 deposit below is treated as growth, not as the
        // opening baseline itself
        tx({ assetId: 1, createdAt: new Date(2025, 5, 1), amountDelta: 0 }),
        tx({ assetId: 1, createdAt: new Date(2026, 2, 1), amountDelta: 100 }),
        tx({ assetId: 2, createdAt: new Date(2025, 5, 1), amountDelta: 0 }),
        tx({ assetId: 2, createdAt: new Date(2026, 2, 1), amountDelta: 1000 }),
      ],
      usdRubRate: 82,
      now: new Date(2026, 6, 1),
    });
    expect(summary.tone).toBe('growth');
    expect(summary.assets.map((a) => a.name)).toEqual(['big', 'small']);
  });
});
