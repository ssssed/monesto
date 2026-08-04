import { cn } from '@monesto/rune';
import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutGrid, Settings, Wallet } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const TABS = [
  { to: '/', label: 'Главная', icon: LayoutGrid, match: (p: string) => p === '/' },
  {
    to: '/assets',
    label: 'Активы',
    icon: Wallet,
    match: (p: string) => p === '/assets' || p.startsWith('/assets/'),
  },
  {
    to: '/settings',
    label: 'Настройки',
    icon: Settings,
    match: (p: string) => p === '/settings' || p.startsWith('/settings/'),
  },
] as const;

export const TAB_BAR_INSET = 110;

/** Soft overshoot — ближе к SHOW_SPRING в mobile. */
const SHOW_EASE = 'cubic-bezier(0.22, 1.2, 0.36, 1)';
/** Snappier hide — ближе к HIDE_SPRING. */
const HIDE_EASE = 'cubic-bezier(0.4, 0.0, 0.2, 1)';

function isMainTabScreen(pathname: string) {
  return pathname === '/' || pathname === '/assets' || pathname === '/settings';
}

export function GlassTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = isMainTabScreen(pathname);
  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) => tab.match(pathname)),
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ width: 0, left: 0 });
  /** After first paint, enable transitions so initial mount isn’t animated from hidden. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const measure = () => {
    const track = trackRef.current;
    if (!track) return;
    const items = track.querySelectorAll<HTMLAnchorElement>('[data-tab-item]');
    const active = items[activeIndex];
    if (!active) return;
    const trackRect = track.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setPill({
      width: activeRect.width,
      left: activeRect.left - trackRect.left,
    });
  };

  useLayoutEffect(() => {
    measure();
  }, [activeIndex, pathname]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(track);
    return () => observer.disconnect();
  }, [activeIndex]);

  return (
    <nav
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-[18px] pb-[max(10px,env(safe-area-inset-bottom))]"
      style={{
        transform: visible
          ? 'translate3d(0, 0, 0)'
          : 'translate3d(0, calc(100% + 24px), 0)',
        opacity: visible ? 1 : 0,
        transition: ready
          ? visible
            ? `transform 580ms ${SHOW_EASE}, opacity 480ms ${SHOW_EASE}`
            : `transform 500ms ${HIDE_EASE}, opacity 280ms ${HIDE_EASE}`
          : 'none',
        willChange: 'transform, opacity',
      }}
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
    >
      <div
        ref={trackRef}
        className={cn(
          'relative mx-auto flex h-[62px] w-full items-center overflow-hidden rounded-full border border-slate-300/50 bg-white/90 p-1.5 shadow-[0_8px_28px_rgb(15_23_42/0.16)] backdrop-blur-xl',
          visible ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        {pill.width > 0 ? (
          <div
            aria-hidden
            className="absolute top-1.5 bottom-1.5 rounded-full bg-[var(--color-navy)]"
            style={{
              left: 0,
              width: Math.max(0, pill.width),
              transform: `translateX(${pill.left}px)`,
              transition: ready
                ? `transform 380ms ${SHOW_EASE}, width 380ms ${SHOW_EASE}`
                : 'none',
            }}
          />
        ) : null}

        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              data-tab-item=""
              tabIndex={visible ? 0 : -1}
              className={cn(
                'relative z-[1] flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide transition-colors duration-300',
                active ? 'text-white' : 'text-slate-500',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
