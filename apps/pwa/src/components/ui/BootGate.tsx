import { useEffect, useState, type ReactNode } from 'react';

import { Loader } from '@/components/ui/Loader';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

const MIN_VISIBLE_MS = 700;
const FADE_MS = 420;

type Props = {
  children: ReactNode;
};

/** Shows the Monesto orbital loader until boot work finishes, then fades out. */
export function BootGate({ children }: Props) {
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    let leaveTimer = 0;
    let readyTimer = 0;

    void (async () => {
      const started = Date.now();
      await useExchangeRateStore.getState().fetchRates();
      if (cancelled) return;

      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - started));
      leaveTimer = window.setTimeout(() => {
        if (cancelled) return;
        setPhase('leaving');
        readyTimer = window.setTimeout(() => {
          if (!cancelled) setPhase('ready');
        }, FADE_MS);
      }, remaining);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(leaveTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  if (phase === 'ready') return <>{children}</>;

  return (
    <>
      {phase === 'leaving' ? children : null}
      <div
        className="fixed inset-0 z-[200] transition-opacity"
        style={{
          opacity: phase === 'leaving' ? 0 : 1,
          transitionDuration: `${FADE_MS}ms`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: phase === 'leaving' ? 'none' : 'auto',
        }}
      >
        <Loader overlay title="Monesto" message="Загружаем приложение…" />
      </div>
    </>
  );
}
