import { CalendarClock, ChevronRight } from 'lucide-react';

function purchasesLabel(count: number): string {
  if (count === 1) return 'покупка';
  if (count < 5) return 'покупки';
  return 'покупок';
}

export function PlannedPeriodEntryCard({
  count,
  topName,
  onClick,
}: {
  count: number;
  topName: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#fffbeb_0%,#fff7ed_52%,#fef2f2_100%)] p-4 shadow-sm ring-1 ring-amber-200/70">
        <div
          className="pointer-events-none absolute -right-4 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.26)_0%,transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-10 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.18)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-amber-600 shadow-sm ring-1 ring-amber-100">
            <CalendarClock className="h-5 w-5" strokeWidth={1.85} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700/80">
              Запланировано на период
            </p>
            <p className="mt-0.5 text-[15px] font-semibold text-slate-900">
              {count} {purchasesLabel(count)}
            </p>
            <p className="mt-0.5 truncate text-xs leading-relaxed text-slate-500">{topName}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-amber-400/80" />
        </div>
      </div>
    </button>
  );
}
