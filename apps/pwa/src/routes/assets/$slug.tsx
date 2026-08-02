import { createFileRoute } from '@tanstack/react-router';

import { AssetDetailScreen } from '@/components/screens';

export const Route = createFileRoute('/assets/$slug')({
  component: () => <AssetDetailScreen slug={Route.useParams().slug} />,
});
