import { createFileRoute, redirect } from '@tanstack/react-router';

import { CycleHistoryScreen } from '@/components/history/CycleHistoryScreen';
import { isOnboardingCompleted } from '@/lib/db';

export const Route = createFileRoute('/history')({
  beforeLoad: async () => {
    if (!(await isOnboardingCompleted())) {
      throw redirect({ to: '/onboarding' });
    }
  },
  component: CycleHistoryScreen,
});
