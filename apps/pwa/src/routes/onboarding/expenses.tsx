import { createFileRoute } from '@tanstack/react-router';

import { MoneyFlowScreen } from '@/components/screens';
import { requireIncompleteOnboarding } from '@/lib/onboarding/guard';

export const Route = createFileRoute('/onboarding/expenses')({
  beforeLoad: requireIncompleteOnboarding,
  component: () => <MoneyFlowScreen mode="expense" onboarding />,
});
