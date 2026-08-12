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

/** Свободный % остатка, без учёта правила `excludeRuleId` (при редактировании). */
export function freeRulesPercent(input: {
  remainder: number;
  rules: DistributionRule[];
  assets: Asset[];
  usdRubRate: number;
  excludeRuleId?: number;
}): number {
  const rules =
    input.excludeRuleId == null
      ? input.rules
      : input.rules.filter((r) => r.id !== input.excludeRuleId);
  return summarizeRulesBudget({ ...input, rules }).freePercent;
}

/** Бюджет с подставленным черновиком правила (создание / правка). */
export function summarizeDraftRulesBudget(input: {
  remainder: number;
  rules: DistributionRule[];
  draft: Omit<DistributionRule, 'id'> & { id?: number };
  assets: Asset[];
  usdRubRate: number;
}): RulesBudgetSummary {
  const others =
    input.draft.id == null
      ? input.rules
      : input.rules.filter((r) => r.id !== input.draft.id);
  const draftRule: DistributionRule = {
    id: input.draft.id ?? -1,
    name: input.draft.name,
    rule_type: input.draft.rule_type,
    value: input.draft.value,
    currency: input.draft.currency,
    target_asset_id: input.draft.target_asset_id,
    sort_order: input.draft.sort_order,
    credit_early_repay_mode: input.draft.credit_early_repay_mode,
  };
  return summarizeRulesBudget({
    remainder: input.remainder,
    rules: [...others, draftRule],
    assets: input.assets,
    usdRubRate: input.usdRubRate,
  });
}
