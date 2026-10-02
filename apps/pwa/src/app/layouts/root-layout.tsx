import { Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { GlassTabBar } from './glass-tab-bar';
import { ROUTES } from '@/shared/config/routes';

export function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onboarding = pathname.startsWith(ROUTES.onboarding.index);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="app-shell relative">
      <div ref={scrollRef} className="app-scroll">
        <Outlet />
      </div>
      {!onboarding ? <GlassTabBar /> : null}
    </div>
  );
}
