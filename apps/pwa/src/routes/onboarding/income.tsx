import { createFileRoute } from '@tanstack/react-router';
import { MoneyFlowScreen } from '@/components/screens';
export const Route = createFileRoute('/onboarding/income')({ component: () => <MoneyFlowScreen mode="income" onboarding /> });
