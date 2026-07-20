import { calcUsdValuation } from '@/lib/exchange/usdValuation';
import type { Asset } from '@/lib/types';

const usdAsset: Asset = {
  id: 1,
  name: 'USD',
  provider: 'usd',
  purpose: null,
  goal_amount: null,
  current_amount: 1000,
  steam_inventory_url: null,
  icon: 'logo-usd',
  bg_color: '#DBEAFE',
  icon_color: '#2563EB',
  cost_basis_rub: 72_000,
};

describe('calcUsdValuation', () => {
  it('computes average buy rate and profit vs current rate', () => {
    const valuation = calcUsdValuation(usdAsset, 82);
    expect(valuation.averageBuyRate).toBe(72);
    expect(valuation.currentValueRub).toBe(82_000);
    expect(valuation.costBasisRub).toBe(72_000);
    expect(valuation.profitRub).toBe(10_000);
    expect(valuation.profitPercent).toBeCloseTo(13.9, 0);
  });

  it('returns null average when empty', () => {
    const valuation = calcUsdValuation({ ...usdAsset, current_amount: 0, cost_basis_rub: 0 }, 82);
    expect(valuation.averageBuyRate).toBeNull();
    expect(valuation.profitRub).toBe(0);
  });
});
