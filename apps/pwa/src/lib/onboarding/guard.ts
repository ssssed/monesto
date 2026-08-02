import { redirect } from '@tanstack/react-router';

import { isOnboardingCompleted } from '@/lib/db';

/** Redirect completed users away from onboarding screens. */
export async function requireIncompleteOnboarding() {
  if (await isOnboardingCompleted()) {
    throw redirect({ to: '/' });
  }
}
