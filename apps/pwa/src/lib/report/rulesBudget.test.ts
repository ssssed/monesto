import { describe, expect, it } from 'vitest';

import {
  freeRulesPercent,
  summarizeDraftRulesBudget,
  summarizeRulesBudget,
} from './rulesBudget';
import type { Asset, DistributionRule } from '../types';

const asset = (id: number): Asset => ({
  id,
  name: `A${id}`,
  provider: 'rub',
  purpose: null,
  goal_amount: null,
  current_amount: 0,
  steam_inventory_url: null,
  icon: 'card',
  bg_color: '#fff',
  icon_color: '#000',
  cost_basis_rub: 0,
  linked_expense_id: null,
  credit_annual_rate: null,
  credit_term_months: null,
  credit_start_date: null,
  credit_remaining_months: null,
  credit_early_repay_mode: null,
  sort_order: id,
});

const rule = (partial: Partial<DistributionRule> & { id: number }): DistributionRule => ({
  name: `R${partial.id}`,
  rule_type: 'percent',
  value: 10,
  currency: 'rub',
  target_asset_id: 1,
  sort_order: partial.id,
  credit_early_repay_mode: null,
  ...partial,
});

describe('rulesBudget', () => {
  it('считает свободный % и overBudget', () => {
    const summary = summarizeRulesBudget({
      remainder: 100_000,
      rules: [rule({ id: 1, value: 40 }), rule({ id: 2, value: 70 })],
      assets: [asset(1)],
      usdRubRate: 80,
    });
    expect(summary.totalPercent).toBeCloseTo(110);
    expect(summary.overBudget).toBe(true);
    expect(summary.freePercent).toBe(0);
  });

  it('freeRulesPercent исключает редактируемое правило', () => {
    const free = freeRulesPercent({
      remainder: 100_000,
      rules: [rule({ id: 1, value: 40 }), rule({ id: 2, value: 30 })],
      assets: [asset(1)],
      usdRubRate: 80,
      excludeRuleId: 2,
    });
    expect(free).toBeCloseTo(60);
  });

  it('черновик процента > свободного даёт overBudget', () => {
    const draft = summarizeDraftRulesBudget({
      remainder: 100_000,
      rules: [rule({ id: 1, value: 80 })],
      draft: {
        name: 'Новое',
        rule_type: 'percent',
        value: 30,
        currency: 'rub',
        target_asset_id: 1,
        sort_order: 2,
        credit_early_repay_mode: null,
      },
      assets: [asset(1)],
      usdRubRate: 80,
    });
    expect(draft.overBudget).toBe(true);
  });

  it('черновик в пределах свободного не overBudget', () => {
    const draft = summarizeDraftRulesBudget({
      remainder: 100_000,
      rules: [rule({ id: 1, value: 80 })],
      draft: {
        name: 'Новое',
        rule_type: 'percent',
        value: 20,
        currency: 'rub',
        target_asset_id: 1,
        sort_order: 2,
        credit_early_repay_mode: null,
      },
      assets: [asset(1)],
      usdRubRate: 80,
    });
    expect(draft.overBudget).toBe(false);
    expect(draft.totalPercent).toBeCloseTo(100);
  });
});
