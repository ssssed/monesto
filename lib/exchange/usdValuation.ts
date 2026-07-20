import type { Asset, UsdValuation } from '@/lib/types';

/** Средняя цена покупки USD и нереализованная прибыль. */
export function calcUsdValuation(asset: Asset, usdRubRate: number): UsdValuation {
  const costBasisRub = asset.cost_basis_rub ?? 0;
  const currentValueRub = Math.round(asset.current_amount * usdRubRate);
  const profitRub = currentValueRub - costBasisRub;
  const averageBuyRate =
    asset.current_amount > 0 && costBasisRub > 0
      ? costBasisRub / asset.current_amount
      : null;
  const profitPercent =
    costBasisRub > 0 ? Math.round((profitRub / costBasisRub) * 1000) / 10 : null;

  return {
    averageBuyRate,
    currentValueRub,
    costBasisRub,
    profitRub,
    profitPercent,
  };
}
