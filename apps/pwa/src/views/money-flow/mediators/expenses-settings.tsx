import { getRouteApi } from '@tanstack/react-router';

import { CycleMoneyFlowPreview } from '../cycle-money-flow-preview';
import { MoneyFlowScreen } from '../money-flow-screen';
import { ROUTES } from '@/shared/config/routes';

const route = getRouteApi(ROUTES.settings.expenses);

export function ExpensesSettings() {
  const { _cycle } = route.useSearch();
  if (_cycle) return <CycleMoneyFlowPreview mode="expense" cycleKey={_cycle} />;
  return <MoneyFlowScreen mode="expense" />;
}
