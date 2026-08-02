import { applyRules } from './applyRules';
import type { Asset, DistributionRule } from '../types';

export interface RuleBudgetSlice {
  ruleId: number;
  name: string;
  amountRub: number;
  /** Доля от остатка, % (фикс тоже переведён в %). */
  percent: number;
}

export interface RulesBudgetSummary {
  remainder: number;
  totalPercent: number;
  freePercent: number;
  overBudget: boolean;
  slices: RuleBudgetSlice[];
}

/** Сколько % остатка «съедают» правила (процентные + фикс, переведённый в %). */
export function summarizeRulesBudget(input: {
  remainder: number;
  rules: DistributionRule[];
  assets: Asset[];
  usdRubRate: number;
}): RulesBudgetSummary {
  const remainder = Math.max(0, input.remainder);
  const allocations = applyRules(remainder, input.rules, input.assets, input.usdRubRate);

  const slices: RuleBudgetSlice[] = allocations.map((item) => ({
    ruleId: item.ruleId,
    name: item.name,
    amountRub: item.amountRub,
    percent: remainder > 0 ? (item.amountRub / remainder) * 100 : 0,
  }));

  const totalPercent = slices.reduce((sum, slice) => sum + slice.percent, 0);

  return {
    remainder,
    totalPercent,
    freePercent: Math.max(0, 100 - totalPercent),
    overBudget: totalPercent > 100.05,
    slices,
  };
}
