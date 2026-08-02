import { cn } from '@monesto/rune';
import { CloudOff, Database, Radio } from 'lucide-react';

import { useExchangeRateStore } from '@/stores/exchange-rate-store';

type Variant = 'badge' | 'inline';

const BADGE_TONE = {
  live: {
    icon: Radio,
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    title: 'Курс загружен сейчас',
  },
  cache: {
    icon: Database,
    className: 'bg-amber-50 text-amber-800 ring-amber-100',
    title: 'Сеть недоступна — используем последний сохранённый курс',
  },
  fallback: {
    icon: CloudOff,
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
    title: 'Нет свежего курса — запасное значение 82 ₽/$',
  },
} as const;

/**
 * `badge` — pill on Home (always shows rate + source).
 * `inline` — plain rate on asset detail; note only for cache / fallback.
 */
export function ExchangeRateBadge({
  className,
  compact = false,
  variant = 'badge',
}: {
  className?: string;
  /** Shorter rate text without «USD» prefix. */
  compact?: boolean;
  variant?: Variant;
}) {
  const rate = useExchangeRateStore((s) => s.usdRubRate);
  const source = useExchangeRateStore((s) => s.rateSource);
  const loading = useExchangeRateStore((s) => s.isLoading);

  if (loading && rate == null) {
    if (variant === 'inline') {
      return (
        <span className={cn('text-[11px] font-medium text-slate-400', className)}>
          Курс…
        </span>
      );
    }
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-slate-200',
          className,
        )}
      >
        Курс…
      </span>
    );
  }

  if (rate == null) return null;

  const rateText = compact
    ? `${rate.toFixed(2)} ₽/$`
    : `USD ${rate.toFixed(2)} ₽`;

  if (variant === 'inline') {
    const note =
      source === 'cache'
        ? { label: 'кэш', title: BADGE_TONE.cache.title }
        : source === 'fallback'
          ? { label: 'запасной', title: BADGE_TONE.fallback.title }
          : null;

    return (
      <span
        className={cn(
          'inline-flex min-w-0 items-center justify-end gap-1.5',
          className,
        )}
      >
        <span className="tabular-nums text-slate-900">{rateText}</span>
        {note ? (
          <span
            className={cn(
              'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              source === 'cache'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-500',
            )}
            title={note.title}
          >
            {note.label}
          </span>
        ) : null}
      </span>
    );
  }

  const tone = source ? BADGE_TONE[source] : BADGE_TONE.live;
  const Icon = tone.icon;
  const sourceLabel =
    source === 'cache' ? 'кэш' : source === 'fallback' ? 'запасной' : 'онлайн';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        tone.className,
        className,
      )}
      title={tone.title}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
      <span>
        {rateText} · {sourceLabel}
      </span>
    </span>
  );
}
