import { applyRules } from './apply-rules';
import type { AssetCalc, DistributionRuleCalc } from './types';

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
  rules: DistributionRuleCalc[];
  assets: AssetCalc[];
  usdRubRate: number;
}): RulesBudgetSummary {
  const remainder = Math.max(0, input.remainder);
  const allocations = applyRules(
    remainder,
    input.rules,
    input.assets,
    input.usdRubRate,
  );

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
  rules: DistributionRuleCalc[];
  assets: AssetCalc[];
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
  rules: DistributionRuleCalc[];
  draft: Omit<DistributionRuleCalc, 'id'> & { id?: number };
  assets: AssetCalc[];
  usdRubRate: number;
}): RulesBudgetSummary {
  const others =
    input.draft.id == null
      ? input.rules
      : input.rules.filter((r) => r.id !== input.draft.id);
  const draftRule: DistributionRuleCalc = {
    id: input.draft.id ?? -1,
    name: input.draft.name,
    ruleType: input.draft.ruleType,
    value: input.draft.value,
    currency: input.draft.currency,
    targetAssetId: input.draft.targetAssetId,
    sortOrder: input.draft.sortOrder,
    creditEarlyRepayMode: input.draft.creditEarlyRepayMode,
  };
  return summarizeRulesBudget({
    remainder: input.remainder,
    rules: [...others, draftRule],
    assets: input.assets,
    usdRubRate: input.usdRubRate,
  });
}
