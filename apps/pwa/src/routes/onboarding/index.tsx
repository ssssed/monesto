import { createFileRoute } from '@tanstack/react-router';

import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { requireIncompleteOnboarding } from '@/lib/onboarding/guard';

export const Route = createFileRoute('/onboarding/')({
  beforeLoad: requireIncompleteOnboarding,
  component: WelcomeScreen,
});
