import { Button } from '@monesto/rune';
import { Link } from '@tanstack/react-router';
import { PartyPopper, X } from 'lucide-react';

import { ROUTES } from '@/shared/config/routes';

export function WishlistAnnouncementBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#f5f3ff_0%,#fdf4ff_52%,#fff1f8_100%)] p-4 shadow-sm ring-1 ring-violet-200/70">
      <div
        className="pointer-events-none absolute -right-4 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.3)_0%,transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-10 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.2)_0%,transparent_70%)]"
        aria-hidden
      />
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Скрыть"
        className="absolute right-3 top-3 z-10 text-slate-400 transition-colors hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative flex items-start gap-3 pr-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-violet-600 shadow-sm ring-1 ring-violet-100">
          <PartyPopper className="h-5 w-5" strokeWidth={1.85} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700/80">
            Новое
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-slate-900">Появился вишлист</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Собирайте хотелки и ставьте им дату — планировать покупки стало ещё проще.
          </p>
          <Link to={ROUTES.wishlist.index} className="mt-3 block w-fit">
            <Button type="button" size="sm" variant="outline" onClick={onDismiss}>
              Посмотреть
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
