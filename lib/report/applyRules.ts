import { convertToRub } from '@/lib/exchange/convertToRub';
import type { Asset, DistributionRule, RuleAllocation } from '@/lib/types';

export function applyRules(
  remainder: number,
  rules: DistributionRule[],
  assets: Asset[],
  usdRubRate: number,
): RuleAllocation[] {
  const sorted = [...rules].sort((a, b) => a.sort_order - b.sort_order);
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return sorted.map((rule) => {
    let amountRub = 0;
    let detail: string | undefined;

    if (rule.rule_type === 'percent') {
      amountRub = Math.round(remainder * (rule.value / 100));
      const asset = rule.target_asset_id != null ? assetMap.get(rule.target_asset_id) : undefined;
      detail = asset ? `${rule.value}% → ${asset.name}` : `${rule.value}%`;
    } else if (rule.currency === 'rub') {
      amountRub = Math.round(rule.value);
      const asset = rule.target_asset_id != null ? assetMap.get(rule.target_asset_id) : undefined;
      detail = asset ? `${rule.value} ₽ → ${asset.name}` : `${rule.value} ₽`;
    } else if (rule.target_asset_id != null) {
      const asset = assetMap.get(rule.target_asset_id);
      const currency = asset?.provider === 'usd' ? 'usd' : 'rub';
      amountRub = convertToRub(rule.value, currency, usdRubRate);
      detail =
        currency === 'usd'
          ? `$${rule.value} (× ${usdRubRate}) → ${asset?.name ?? ''}`
          : `${rule.value} ₽ → ${asset?.name ?? ''}`;
    } else {
      amountRub = Math.round(rule.value);
    }

    return {
      name: rule.name,
      amountRub,
      detail,
      ruleId: rule.id,
      targetAssetId: rule.target_asset_id,
    };
  });
}
