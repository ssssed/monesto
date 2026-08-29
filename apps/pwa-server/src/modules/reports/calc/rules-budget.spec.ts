import {
  freeRulesPercent,
  summarizeDraftRulesBudget,
  summarizeRulesBudget,
} from './rules-budget';
import type { DistributionRuleCalc } from './types';

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

describe('summarizeRulesBudget', () => {
  it('clamps a negative remainder to 0 before applying rules', () => {
    const summary = summarizeRulesBudget({
      remainder: -500,
      rules: [rule({ ruleType: 'percent', value: 50 })],
      assets: [],
      usdRubRate: 82,
    });
    expect(summary.remainder).toBe(0);
    expect(summary.slices[0].amountRub).toBe(0);
  });

  it('converts a fixed rub rule into an effective percent of the remainder', () => {
    const summary = summarizeRulesBudget({
      remainder: 10_000,
      rules: [rule({ ruleType: 'fixed', currency: 'rub', value: 2500 })],
      assets: [],
      usdRubRate: 82,
    });
    expect(summary.slices[0].percent).toBe(25);
  });

  it('flags overBudget once total percent exceeds the 100.05 tolerance', () => {
    const summary = summarizeRulesBudget({
      remainder: 1000,
      rules: [rule({ value: 60 }), rule({ id: 2, value: 60 })],
      assets: [],
      usdRubRate: 82,
    });
    expect(summary.overBudget).toBe(true);
    expect(summary.freePercent).toBe(0);
  });
});

describe('freeRulesPercent', () => {
  it('excludes the given rule id from the calculation', () => {
    const rules = [rule({ id: 1, value: 30 }), rule({ id: 2, value: 20 })];
    const withBoth = freeRulesPercent({
      remainder: 1000,
      rules,
      assets: [],
      usdRubRate: 82,
    });
    const excludingOne = freeRulesPercent({
      remainder: 1000,
      rules,
      assets: [],
      usdRubRate: 82,
      excludeRuleId: 1,
    });
    expect(excludingOne).toBeGreaterThan(withBoth);
    expect(excludingOne).toBe(80);
  });
});

describe('summarizeDraftRulesBudget', () => {
  it('substitutes a new draft rule (no id) alongside existing rules', () => {
    const summary = summarizeDraftRulesBudget({
      remainder: 1000,
      rules: [rule({ id: 1, value: 20 })],
      draft: {
        name: 'Draft',
        ruleType: 'percent',
        value: 30,
        currency: 'rub',
        targetAssetId: null,
        sortOrder: 1,
        creditEarlyRepayMode: null,
      },
      assets: [],
      usdRubRate: 82,
    });
    expect(summary.slices).toHaveLength(2);
    expect(summary.totalPercent).toBe(50);
  });

  it('replaces an existing rule when the draft carries its id', () => {
    const summary = summarizeDraftRulesBudget({
      remainder: 1000,
      rules: [rule({ id: 1, value: 20 }), rule({ id: 2, value: 20 })],
      draft: {
        id: 1,
        name: 'Edited',
        ruleType: 'percent',
        value: 40,
        currency: 'rub',
        targetAssetId: null,
        sortOrder: 0,
        creditEarlyRepayMode: null,
      },
      assets: [],
      usdRubRate: 82,
    });
    expect(summary.slices).toHaveLength(2);
    expect(summary.totalPercent).toBe(60);
  });
});
