import { createFileRoute } from '@tanstack/react-router';

import { MoneyFlowScreen } from '@/components/screens';
import { requireIncompleteOnboarding } from '@/lib/onboarding/guard';

export const Route = createFileRoute('/onboarding/income')({
  beforeLoad: requireIncompleteOnboarding,
  component: () => <MoneyFlowScreen mode="income" onboarding />,
});
