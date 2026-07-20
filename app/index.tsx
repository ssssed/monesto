import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppLoader } from '@/components/ui/AppLoader';
import { isOnboardingCompleted } from '@/lib/db/client';

export default function IndexScreen() {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboardingCompleted().then(setCompleted);
  }, []);

  if (completed === null) {
    return <AppLoader message="Подготавливаем приложение..." />;
  }

  return completed ? <Redirect href="/(tabs)" /> : <Redirect href="/(onboarding)/income" />;
}
