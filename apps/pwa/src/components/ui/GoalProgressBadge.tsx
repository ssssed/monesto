import { cn } from '@monesto/rune';

/** Compact goal ring + percent — matches mobile assets list. */
export function GoalProgressBadge({
  current,
  goal,
  className,
}: {
  current: number;
  goal: number;
  className?: string;
}) {
  const progress = goal > 0 ? Math.min(Math.max(current / goal, 0), 1) : 0;
  const pct = Math.round(progress * 100);
  const size = 16;
  const border = 2;

  return (
    <div className={cn('flex shrink-0 items-center', className)}>
      <div
        className="relative"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <div
          className="absolute inset-0 rounded-full border-slate-200"
          style={{ borderWidth: border }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            borderWidth: border,
            borderStyle: 'solid',
            borderColor: 'transparent',
            borderTopColor: progress > 0.02 ? '#2563EB' : 'transparent',
            borderRightColor: progress > 0.25 ? '#2563EB' : 'transparent',
            borderBottomColor: progress > 0.5 ? '#2563EB' : 'transparent',
            borderLeftColor: progress > 0.75 ? '#2563EB' : 'transparent',
            transform: 'rotate(-45deg)',
          }}
        />
      </div>
      <span className="ml-1 text-xs font-semibold text-blue-600">{pct}%</span>
    </div>
  );
}

/** USD valuation pill — green when up, red when down. */
export function TrendBadge({
  value,
  positive,
  className,
}: {
  value: string;
  positive: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
        positive
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-rose-50 text-rose-600',
        className,
      )}
    >
      {value}
    </span>
  );
}
