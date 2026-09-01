import { createFileRoute } from '@tanstack/react-router';

import { CycleMoneyFlowPreview, MoneyFlowScreen } from '@/components/screens';

type MoneyFlowSearch = {
  _cycle?: string;
};

export const Route = createFileRoute('/settings/expenses')({
  validateSearch: (search: Record<string, unknown>): MoneyFlowSearch => ({
    _cycle: typeof search._cycle === 'string' ? search._cycle : undefined,
  }),
  component: ExpensesSettingsPage,
});

function ExpensesSettingsPage() {
  const { _cycle } = Route.useSearch();
  if (_cycle) return <CycleMoneyFlowPreview mode="expense" cycleKey={_cycle} />;
  return <MoneyFlowScreen mode="expense" />;
}
