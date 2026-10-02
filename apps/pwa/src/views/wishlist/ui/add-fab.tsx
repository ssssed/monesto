import { Plus } from 'lucide-react';
import { createPortal } from 'react-dom';

import { ROUTES } from '@/shared/config/routes';
import { Link } from '@tanstack/react-router';

/** Плавающая кнопка «+», стиль как у Plus/Minus на главной (FreeMoneyQuickActions). */
export function AddFab() {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 w-full">
      <div className="relative mx-auto h-0">
        <Link
          to={ROUTES.wishlist.new}
          aria-label="Добавить хотелку"
          className="pointer-events-auto absolute bottom-[calc(24px+env(safe-area-inset-bottom))] right-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-navy)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      </div>
    </div>,
    document.body
  );
}
