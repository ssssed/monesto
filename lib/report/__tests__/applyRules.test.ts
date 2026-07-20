import { applyRules } from '@/lib/report/applyRules';
import type { Asset, DistributionRule } from '@/lib/types';

const assets: Asset[] = [
  {
    id: 1,
    name: 'USD резерв',
    provider: 'usd',
    purpose: null,
    goal_amount: null,
    current_amount: 500,
    steam_inventory_url: null,
    icon: 'logo-usd',
    bg_color: '#DBEAFE',
    icon_color: '#2563EB',
    cost_basis_rub: 41000,
  },
];

describe('applyRules', () => {
  it('applies 10 percent rule', () => {
    const rules: DistributionRule[] = [
      {
        id: 1,
        name: 'Подушка',
        rule_type: 'percent',
        value: 10,
        currency: 'rub',
        target_asset_id: null,
        sort_order: 0,
      },
    ];
    expect(applyRules(68_000, rules, assets, 82)[0]?.amountRub).toBe(6800);
  });

  it('applies two percent rules from original remainder', () => {
    const rules: DistributionRule[] = [
      {
        id: 1,
        name: 'Подушка',
        rule_type: 'percent',
        value: 10,
        currency: 'rub',
        target_asset_id: null,
        sort_order: 0,
      },
      {
        id: 2,
        name: 'Непредвиденные',
        rule_type: 'percent',
        value: 10,
        currency: 'rub',
        target_asset_id: null,
        sort_order: 1,
      },
    ];
    const allocations = applyRules(68_000, rules, assets, 82);
    expect(allocations[0]?.amountRub).toBe(6800);
    expect(allocations[1]?.amountRub).toBe(6800);
  });

  it('applies fixed rub rule', () => {
    const rules: DistributionRule[] = [
      {
        id: 1,
        name: 'Фикс',
        rule_type: 'fixed',
        value: 100,
        currency: 'rub',
        target_asset_id: null,
        sort_order: 0,
      },
    ];
    expect(applyRules(10_000, rules, assets, 82)[0]?.amountRub).toBe(100);
  });

  it('converts fixed usd asset rule using exchange rate', () => {
    const rules: DistributionRule[] = [
      {
        id: 1,
        name: 'USD-резерв',
        rule_type: 'fixed',
        value: 100,
        currency: 'asset',
        target_asset_id: 1,
        sort_order: 0,
      },
    ];
    expect(applyRules(68_000, rules, assets, 82)[0]?.amountRub).toBe(8200);
  });

  it('returns empty list for no rules', () => {
    expect(applyRules(68_000, [], assets, 82)).toEqual([]);
  });
});
