import { createFileRoute } from '@tanstack/react-router';
import { AssetFormScreen } from '@/components/screens';

export const Route = createFileRoute('/assets/new')({
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === 'string' ? search.from : undefined,
  }),
  component: NewAssetPage,
});

function NewAssetPage() {
  const { from } = Route.useSearch();
  return (
    <AssetFormScreen
      returnTo={from === 'rules' ? '/settings/rules' : undefined}
    />
  );
}
