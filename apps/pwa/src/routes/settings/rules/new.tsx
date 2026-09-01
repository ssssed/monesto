import { createFileRoute } from '@tanstack/react-router';

import { RuleFormScreen } from '@/components/screens';

type RuleFormSearch = {
  asset?: string;
};

export const Route = createFileRoute('/settings/rules/new')({
  validateSearch: (search: Record<string, unknown>): RuleFormSearch => ({
    asset: typeof search.asset === 'string' ? search.asset : undefined,
  }),
  component: NewRulePage,
});

function NewRulePage() {
  const { asset } = Route.useSearch();
  return (
    <RuleFormScreen defaultTargetAssetId={asset ? Number(asset) : undefined} />
  );
}
