import { formatDateDisplay } from '@monesto/rune';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ROUTES } from '@/shared/config/routes';
import { AssetAvatar } from '@/entities/wishlist';
import { SwipeToDelete } from '@/shared/ui/swipe-to-delete';
import { UndoToast } from '@/shared/ui/undo-toast';
import * as db from '@/kernel/db';
import type { WishlistItem } from '@/kernel/types';
import { formatMoney } from '@/shared/lib/format';
import { UNDO_MS } from '@/shared/lib/layout';
import { WishlistEmptyState } from '../ui/wishlist-empty-state';
import { WishlistSwipeRow } from '../ui/wishlist-swipe-row';

export function WishlistList({
  items,
  variant,
  onDeleted,
  onPlanRequested,
}: {
  items: WishlistItem[];
  variant: 'items' | 'planned';
  onDeleted: () => void;
  onPlanRequested?: (item: WishlistItem) => void;
}) {
  const [localItems, setLocalItems] = useState(items);
  const [toast, setToast] = useState<{ id: number; name: string } | null>(null);
  const pendingRef = useRef(
    new Map<number, { item: WishlistItem; timer: ReturnType<typeof setTimeout> }>(),
  );

  useEffect(() => {
    const pendingIds = new Set(pendingRef.current.keys());
    setLocalItems(items.filter((item) => !pendingIds.has(item.id)));
  }, [items]);

  const commitDelete = useCallback(
    async (id: number) => {
      pendingRef.current.delete(id);
      try {
        await db.deleteWishlistItem(id);
      } catch {
        // already gone
      }
      setToast((prev) => (prev?.id === id ? null : prev));
      onDeleted();
    },
    [onDeleted],
  );

  const scheduleDelete = useCallback(
    (item: WishlistItem) => {
      const existing = pendingRef.current.get(item.id);
      if (existing) clearTimeout(existing.timer);
      setLocalItems((prev) => prev.filter((i) => i.id !== item.id));
      const timer = setTimeout(() => {
        void commitDelete(item.id);
      }, UNDO_MS);
      pendingRef.current.set(item.id, { item, timer });
      setToast({ id: item.id, name: item.name });
    },
    [commitDelete],
  );

  const undoDelete = useCallback(() => {
    if (!toast) return;
    const pending = pendingRef.current.get(toast.id);
    if (!pending) {
      setToast(null);
      return;
    }
    clearTimeout(pending.timer);
    pendingRef.current.delete(toast.id);
    setLocalItems((prev) =>
      [...prev, pending.item].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id,
      ),
    );
    setToast(null);
  }, [toast]);

  return (
    <div className="relative">
      <UndoToast
        visible={toast != null}
        message={toast ? `Удалено «${toast.name}»` : ''}
        durationMs={UNDO_MS}
        onUndo={undoDelete}
        onDismiss={() => setToast(null)}
      />

      {localItems.length === 0 ? (
        <WishlistEmptyState variant={variant} />
      ) : (
        <div className="space-y-3">
          {localItems.map((item) => {
            const row = (
              <Link
                to={ROUTES.wishlist.detail}
                params={{ id: String(item.id) }}
                className="flex min-w-0 items-center gap-3 px-3 py-3.5"
              >
                <AssetAvatar icon={item.icon} bgColor={item.bg_color} iconColor={item.icon_color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold leading-5 text-slate-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-400">
                    {item.price != null
                      ? formatMoney(item.price, item.currency === 'usd' ? 'usd' : 'rub')
                      : 'Цена не указана'}
                    {variant === 'planned' && item.planned_date
                      ? ` · ${formatDateDisplay(item.planned_date)}`
                      : ''}
                  </p>
                </div>
              </Link>
            );

            if (variant === 'planned') {
              return (
                <SwipeToDelete key={item.id} borderRadius={16} onDelete={() => scheduleDelete(item)}>
                  {row}
                </SwipeToDelete>
              );
            }

            return (
              <WishlistSwipeRow
                key={item.id}
                borderRadius={16}
                onDelete={() => scheduleDelete(item)}
                onPlan={onPlanRequested ? () => onPlanRequested(item) : undefined}
              >
                {row}
              </WishlistSwipeRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
