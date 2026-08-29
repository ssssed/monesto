import { convertToRub } from './convert-to-rub';
import type { AssetCalc, DistributionRuleCalc } from './types';
import type { RuleAllocationDto } from './dto';

export type RuleAllocationCalc = Omit<RuleAllocationDto, 'status'>;

export function applyRules(
  remainder: number,
  rules: DistributionRuleCalc[],
  assets: AssetCalc[],
  usdRubRate: number,
): RuleAllocationCalc[] {
  const sorted = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return sorted.map((rule) => {
    let amountRub = 0;

    if (rule.ruleType === 'percent') {
      amountRub = Math.round(remainder * (rule.value / 100));
    } else if (rule.currency === 'rub') {
      amountRub = Math.round(rule.value);
    } else if (rule.targetAssetId != null) {
      const asset = assetMap.get(rule.targetAssetId);
      const currency = asset?.provider === 'usd' ? 'usd' : 'rub';
      amountRub = convertToRub(rule.value, currency, usdRubRate);
    } else {
      amountRub = Math.round(rule.value);
    }

    const targetAsset =
      rule.targetAssetId != null
        ? (assetMap.get(rule.targetAssetId) ?? null)
        : null;

    return {
      ruleId: rule.id,
      name: rule.name,
      ruleType: rule.ruleType,
      value: rule.value,
      currency: rule.currency,
      targetAssetId: rule.targetAssetId,
      targetAssetName: targetAsset?.name ?? null,
      amountRub,
    };
  });
}
