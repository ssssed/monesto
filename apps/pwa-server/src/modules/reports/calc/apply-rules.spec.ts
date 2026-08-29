import { applyRules } from './apply-rules';
import type { AssetCalc, DistributionRuleCalc } from './types';

const rubAsset: AssetCalc = {
  id: 1,
  name: 'Копилка',
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
};

const usdAsset: AssetCalc = {
  ...rubAsset,
  id: 2,
  name: 'USD stash',
  provider: 'usd',
};

function rule(overrides: Partial<DistributionRuleCalc>): DistributionRuleCalc {
  return {
    id: 1,
    name: 'Rule',
    ruleType: 'percent',
    value: 10,
    currency: 'rub',
    targetAssetId: null,
    sortOrder: 0,
    creditEarlyRepayMode: null,
    ...overrides,
  };
}

describe('applyRules', () => {
  it('percent rule rounds a share of the remainder', () => {
    const [allocation] = applyRules(
      10_000,
      [rule({ ruleType: 'percent', value: 15 })],
      [],
      82,
    );
    expect(allocation.amountRub).toBe(1500);
  });

  it('fixed rub rule ignores the remainder entirely', () => {
    const [allocation] = applyRules(
      100,
      [rule({ ruleType: 'fixed', currency: 'rub', value: 5000 })],
      [],
      82,
    );
    expect(allocation.amountRub).toBe(5000);
  });

  it('fixed asset-currency rule converts usd target via the given rate', () => {
    const [allocation] = applyRules(
      0,
      [
        rule({
          ruleType: 'fixed',
          currency: 'asset',
          value: 100,
          targetAssetId: 2,
        }),
      ],
      [usdAsset],
      82,
    );
    expect(allocation.amountRub).toBe(8200);
    expect(allocation.targetAssetName).toBe('USD stash');
  });

  it('fixed asset-currency rule treats a rub target as 1:1', () => {
    const [allocation] = applyRules(
      0,
      [
        rule({
          ruleType: 'fixed',
          currency: 'asset',
          value: 100,
          targetAssetId: 1,
        }),
      ],
      [rubAsset],
      82,
    );
    expect(allocation.amountRub).toBe(100);
  });

  it('degenerate fixed asset-currency rule with no target falls back to plain rounding', () => {
    const [allocation] = applyRules(
      0,
      [
        rule({
          ruleType: 'fixed',
          currency: 'asset',
          value: 100,
          targetAssetId: null,
        }),
      ],
      [],
      82,
    );
    expect(allocation.amountRub).toBe(100);
  });

  it('sorts rules by sortOrder before applying', () => {
    const allocations = applyRules(
      100,
      [
        rule({ id: 2, sortOrder: 1, name: 'second' }),
        rule({ id: 1, sortOrder: 0, name: 'first' }),
      ],
      [],
      82,
    );
    expect(allocations.map((a) => a.name)).toEqual(['first', 'second']);
  });

  it('percent rule against a negative remainder produces a negative allocation, unclamped', () => {
    const [allocation] = applyRules(
      -1000,
      [rule({ ruleType: 'percent', value: 10 })],
      [],
      82,
    );
    expect(allocation.amountRub).toBe(-100);
  });
});
