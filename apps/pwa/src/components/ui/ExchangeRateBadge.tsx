import { cn } from '@monesto/rune';

import { useExchangeRateStore } from '@/stores/exchange-rate-store';

/** Rate as plain text; small note only for cache / fallback. */
export function ExchangeRateBadge({
  className,
  compact = false,
}: {
  className?: string;
  /** Shorter rate text without «USD» prefix. */
  compact?: boolean;
}) {
  const rate = useExchangeRateStore((s) => s.usdRubRate);
  const source = useExchangeRateStore((s) => s.rateSource);
  const loading = useExchangeRateStore((s) => s.isLoading);

  if (loading && rate == null) {
    return (
      <span className={cn('text-[11px] font-medium text-slate-400', className)}>
        Курс…
      </span>
    );
  }

  if (rate == null) return null;

  const note =
    source === 'cache'
      ? { label: 'кэш', title: 'Сеть недоступна — последний сохранённый курс' }
      : source === 'fallback'
        ? { label: 'запасной', title: 'Нет свежего курса — значение по умолчанию' }
        : null;

  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center justify-end gap-1.5',
        className,
      )}
    >
      <span className="tabular-nums text-slate-900">
        {compact ? `${rate.toFixed(2)} ₽/$` : `USD ${rate.toFixed(2)} ₽`}
      </span>
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
