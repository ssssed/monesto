import { createFileRoute } from '@tanstack/react-router';
import { MoneyFlowScreen } from '@/components/screens';
export const Route = createFileRoute('/onboarding/expenses')({ component: () => <MoneyFlowScreen mode="expense" onboarding /> });
