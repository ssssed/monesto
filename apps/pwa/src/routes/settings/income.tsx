import { createFileRoute } from '@tanstack/react-router';

import { CycleMoneyFlowPreview, MoneyFlowScreen } from '@/components/screens';

type MoneyFlowSearch = {
  _cycle?: string;
};

export const Route = createFileRoute('/settings/income')({
  validateSearch: (search: Record<string, unknown>): MoneyFlowSearch => ({
    _cycle: typeof search._cycle === 'string' ? search._cycle : undefined,
  }),
  component: IncomeSettingsPage,
});

function IncomeSettingsPage() {
  const { _cycle } = Route.useSearch();
  if (_cycle) return <CycleMoneyFlowPreview mode="income" cycleKey={_cycle} />;
  return <MoneyFlowScreen mode="income" />;
}
