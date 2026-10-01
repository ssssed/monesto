import { useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@monesto/rune';

/**
 * iOS-like push/pop: deeper routes slide in from the right,
 * going back slides in from the left.
 */
export function PageTransition({
  children,
  fill = false,
}: {
  children: ReactNode;
  /** Use full shell height (for forms with pinned footers). */
  fill?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPath = useRef(pathname);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animKey, setAnimKey] = useState(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    const prevDepth = prevPath.current.split('/').filter(Boolean).length;
    const nextDepth = pathname.split('/').filter(Boolean).length;
    const nextDir =
      nextDepth < prevDepth ||
      (prevPath.current.startsWith(pathname) && pathname !== prevPath.current)
        ? 'back'
        : 'forward';
    setDirection(nextDir);
    setAnimKey(pathname);
    prevPath.current = pathname;
  }, [pathname]);

  return (
    <div
      key={animKey}
      className={cn(
        'animate-in fade-in-0 duration-300 fill-mode-both',
        fill ? 'h-full min-h-0 overflow-hidden' : 'min-h-full',
        direction === 'forward'
          ? 'slide-in-from-right-4'
          : 'slide-in-from-left-4',
      )}
    >
      {children}
    </div>
  );
}
