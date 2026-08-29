import { createFileRoute } from '@tanstack/react-router';

import { MoneyFlowScreen } from '@/components/screens';

type MoneyFlowSearch = {
  _mode?: 'preview';
};

export const Route = createFileRoute('/settings/income')({
  validateSearch: (search: Record<string, unknown>): MoneyFlowSearch => ({
    _mode: search._mode === 'preview' ? 'preview' : undefined,
  }),
  component: IncomeSettingsPage,
});

function IncomeSettingsPage() {
  const { _mode } = Route.useSearch();
  return <MoneyFlowScreen mode="income" preview={_mode === 'preview'} />;
}
