import { getRouteApi } from '@tanstack/react-router';

import { CycleMoneyFlowPreview } from '../cycle-money-flow-preview';
import { MoneyFlowScreen } from '../money-flow-screen';
import { ROUTES } from '@/shared/config/routes';

const route = getRouteApi(ROUTES.settings.income);

export function IncomeSettings() {
  const { _cycle } = route.useSearch();
  if (_cycle) return <CycleMoneyFlowPreview mode="income" cycleKey={_cycle} />;
  return <MoneyFlowScreen mode="income" />;
}
