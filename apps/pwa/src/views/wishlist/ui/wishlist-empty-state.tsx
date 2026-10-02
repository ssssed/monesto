import { Button } from '@monesto/rune';
import { Link } from '@tanstack/react-router';
import { CalendarClock, Sparkles } from 'lucide-react';

import { ROUTES } from '@/shared/config/routes';

export function WishlistEmptyState({ variant }: { variant: 'items' | 'planned' }) {
  if (variant === 'planned') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#fffbeb_0%,#fff7ed_100%)] px-6 py-10 text-center ring-1 ring-amber-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-amber-600 shadow-sm ring-1 ring-amber-100">
          <CalendarClock className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Пока ничего не запланировано</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Смахните хотелку вправо на вкладке «Хотелки» и укажите дату — она
            появится здесь
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#fdf4ff_0%,#fff1f8_100%)] px-6 py-10 text-center ring-1 ring-pink-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-pink-600 shadow-sm ring-1 ring-pink-100">
        <Sparkles className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-semibold text-slate-900">Вишлист пока пуст</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Соберите сюда всё, чего хочется, — от наушников до отпуска
        </p>
      </div>
      <Link to={ROUTES.wishlist.new}>
        <Button type="button" size="sm">
          Добавить хотелку
        </Button>
      </Link>
    </div>
  );
}
