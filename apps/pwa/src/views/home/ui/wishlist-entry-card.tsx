import { Card } from '@monesto/rune';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Heart } from 'lucide-react';

import { ROUTES } from '@/shared/config/routes';

export function WishlistEntryCard({
  count,
  topName,
}: {
  count: number;
  topName: string;
}) {
  return (
    <Link to={ROUTES.wishlist.index} className="block">
      <Card className="border-pink-100 bg-pink-50/60 p-4 shadow-none">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
            <Heart className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">
              Вишлист · {count}{' '}
              {count === 1 ? 'хотелка' : count < 5 ? 'хотелки' : 'хотелок'}
            </p>
            <p className="truncate text-sm text-slate-400">{topName}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </div>
      </Card>
    </Link>
  );
}
