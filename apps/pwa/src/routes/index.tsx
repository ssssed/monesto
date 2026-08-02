import { createFileRoute, redirect } from '@tanstack/react-router';
import { HomeScreen } from '@/components/screens';
import { isOnboardingCompleted } from '@/lib/db';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    if (!(await isOnboardingCompleted())) throw redirect({ to: '/onboarding/income' });
  },
  component: HomeScreen,
});
