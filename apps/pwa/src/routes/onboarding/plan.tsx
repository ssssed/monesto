import { createFileRoute } from '@tanstack/react-router';

import { AssetsIntroScreen } from '@/components/onboarding/AssetsIntroScreen';
import { requireIncompleteOnboarding } from '@/lib/onboarding/guard';

export const Route = createFileRoute('/onboarding/plan')({
  beforeLoad: requireIncompleteOnboarding,
  component: AssetsIntroScreen,
});
