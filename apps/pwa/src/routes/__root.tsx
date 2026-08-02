import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { GlassTabBar } from '@/components/layout/GlassTabBar';
import {
  NotFoundScreen,
  ServerErrorScreen,
} from '@/components/ui/ErrorPage';

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onboarding = pathname.startsWith('/onboarding');
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

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundScreen,
  errorComponent: ServerErrorScreen,
});
