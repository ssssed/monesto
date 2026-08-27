import { Link } from '@tanstack/react-router';
import { ChevronRight, Sparkles } from 'lucide-react';

import type { YearSummary } from '@/lib/year-summary/computeYearSummary';

export function YearSummaryBanner({ summary }: { summary: YearSummary }) {
  return (
    <Link to="/year-summary" className="block">
      <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0b1220_0%,#14532d_48%,#7f1d1d_100%)] p-4 text-white shadow-lg ring-1 ring-white/10">
        <div
          className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.35)_0%,transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-300 ring-1 ring-white/15">
            <Sparkles className="h-5 w-5" strokeWidth={1.85} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200/90">
              Итоги {summary.year}
            </p>
            <p className="mt-0.5 truncate text-[15px] font-semibold text-white">
              {summary.bannerHint}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/55">
              Откройте новогодний отчёт по активам
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-white/45" />
        </div>
      </div>
    </Link>
  );
}
