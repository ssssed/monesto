import { Link } from '@tanstack/react-router';
import { CalendarDays, ChevronRight } from 'lucide-react';

export function VacationBanner() {
  return (
    <Link to="/settings/vacation" className="block">
      <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#eff6ff_0%,#ecfeff_52%,#f0fdf4_100%)] p-4 shadow-sm ring-1 ring-sky-200/70">
        <div
          className="pointer-events-none absolute -right-4 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.28)_0%,transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-10 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-sky-600 shadow-sm ring-1 ring-sky-100">
            <CalendarDays className="h-5 w-5" strokeWidth={1.85} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700/80">
              Точнее прогноз
            </p>
            <p className="mt-0.5 text-[15px] font-semibold text-slate-900">
              Укажите отпуск
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Учтём отпускные и скорректируем зарплату в цикле
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-sky-400/80" />
        </div>
      </div>
    </Link>
  );
}
