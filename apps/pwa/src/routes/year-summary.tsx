import { createFileRoute, redirect } from '@tanstack/react-router';

import { YearSummaryScreen } from '@/components/year-summary/YearSummaryScreen';
import { isOnboardingCompleted } from '@/lib/db';
import { isYearSummaryEnabled } from '@/lib/features';

export const Route = createFileRoute('/year-summary')({
  beforeLoad: async () => {
    if (!(await isOnboardingCompleted())) {
      throw redirect({ to: '/onboarding' });
    }
    if (!isYearSummaryEnabled()) {
      throw redirect({ to: '/' });
    }
  },
  component: YearSummaryScreen,
});
