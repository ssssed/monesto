import { createFileRoute } from '@tanstack/react-router';

import { MoneyFlowScreen } from '@/components/screens';

type MoneyFlowSearch = {
  _mode?: 'preview';
};

export const Route = createFileRoute('/settings/expenses')({
  validateSearch: (search: Record<string, unknown>): MoneyFlowSearch => ({
    _mode: search._mode === 'preview' ? 'preview' : undefined,
  }),
  component: ExpensesSettingsPage,
});

function ExpensesSettingsPage() {
  const { _mode } = Route.useSearch();
  return <MoneyFlowScreen mode="expense" preview={_mode === 'preview'} />;
}
