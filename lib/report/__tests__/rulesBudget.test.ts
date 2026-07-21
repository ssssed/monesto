import { applyRules } from '@/lib/report/applyRules';
import { summarizeRulesBudget } from '@/lib/report/rulesBudget';
import type { Asset, DistributionRule } from '@/lib/types';

const asset = (id: number, provider: 'rub' | 'usd' = 'rub'): Asset => ({
  id,
  name: `Asset ${id}`,
  provider,
  purpose: null,
  goal_amount: null,
  current_amount: 0,
  steam_inventory_url: null,
  icon: 'wallet-outline',
  bg_color: '#DBEAFE',
  icon_color: '#2563EB',
  cost_basis_rub: 0,
});

describe('summarizeRulesBudget', () => {
  it('converts fixed rub rule into percent of remainder', () => {
    const rules: DistributionRule[] = [
      {
        id: 1,
        name: 'Percent',
        rule_type: 'percent',
        value: 20,
        currency: 'rub',
        target_asset_id: 1,
        sort_order: 0,
      },
      {
        id: 2,
        name: 'Fixed',
        rule_type: 'fixed',
        value: 10000,
        currency: 'rub',
        target_asset_id: 2,
        sort_order: 1,
      },
    ];

    const summary = summarizeRulesBudget({
      remainder: 100000,
      rules,
      assets: [asset(1), asset(2)],
      usdRubRate: 82,
    });

    expect(summary.slices[0].percent).toBeCloseTo(20, 5);
    expect(summary.slices[1].percent).toBeCloseTo(10, 5);
    expect(summary.totalPercent).toBeCloseTo(30, 5);
    expect(summary.overBudget).toBe(false);
  });

  it('flags over-budget when rules exceed 100%', () => {
    const rules: DistributionRule[] = [
      {
        id: 1,
        name: 'A',
        rule_type: 'percent',
        value: 60,
        currency: 'rub',
        target_asset_id: 1,
        sort_order: 0,
      },
      {
        id: 2,
        name: 'B',
        rule_type: 'percent',
        value: 60,
        currency: 'rub',
        target_asset_id: 2,
        sort_order: 1,
      },
    ];

    const summary = summarizeRulesBudget({
      remainder: 50000,
      rules,
      assets: [asset(1), asset(2)],
      usdRubRate: 82,
    });

    expect(summary.totalPercent).toBeCloseTo(120, 5);
    expect(summary.overBudget).toBe(true);
    expect(applyRules(50000, rules, [asset(1), asset(2)], 82).length).toBe(2);
  });
});
