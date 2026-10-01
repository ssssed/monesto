import { redirect } from '@tanstack/react-router';

import { isOnboardingCompleted } from '@/kernel/db';
import { ROUTES } from '@/shared/config/routes';

/** Redirect completed users away from onboarding screens. */
export async function requireIncompleteOnboarding() {
  if (await isOnboardingCompleted()) {
    throw redirect({ to: ROUTES.home });
  }
}
