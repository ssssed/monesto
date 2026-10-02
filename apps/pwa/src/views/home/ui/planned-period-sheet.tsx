import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  formatDateDisplay,
} from '@monesto/rune';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { AssetAvatar, PlanDateSheet } from '@/entities/wishlist';
import * as db from '@/kernel/db';
import type { WishlistItem } from '@/kernel/types';
import { ROUTES } from '@/shared/config/routes';
import { formatMoney } from '@/shared/lib/format';

export function PlannedPeriodSheet({
  items,
  freeMoney,
  open,
  onOpenChange,
  onSpend,
  onChanged,
}: {
  items: WishlistItem[];
  freeMoney: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpend: (item: WishlistItem) => void;
  onChanged: () => void;
}) {
  const [rescheduleTarget, setRescheduleTarget] = useState<WishlistItem | null>(null);

  const confirmReschedule = async (plannedDateIso: string) => {
    if (!rescheduleTarget) return;
    await db.updateWishlistItem(rescheduleTarget.id, { planned_date: plannedDateIso });
    setRescheduleTarget(null);
    onChanged();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="min-h-[30vh]">
          <SheetHeader>
            <SheetTitle>Запланировано на этот период</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            {items.length === 0 ? (
              <p className="py-2 text-center text-sm text-slate-400">
                На этот период больше ничего не запланировано
              </p>
            ) : null}
            {items.map((item) => {
              const affordable = item.price == null || item.price <= freeMoney;
              return (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <AssetAvatar
                      icon={item.icon}
                      bgColor={item.bg_color}
                      iconColor={item.icon_color}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.price != null
                          ? formatMoney(item.price, item.currency === 'usd' ? 'usd' : 'rub')
                          : 'Цена не указана'}
                        {item.planned_date ? ` · ${formatDateDisplay(item.planned_date)}` : ''}
                      </p>
                    </div>
                    {affordable ? (
                      <Button size="sm" onClick={() => onSpend(item)}>
                        Потратить
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRescheduleTarget(item)}>
                        Перенести
                      </Button>
                    )}
                  </div>
                  {!affordable ? (
                    <p className="mt-2 text-xs leading-relaxed text-amber-700">
                      Свободных денег не хватает на эту покупку — перенесите дату на более
                      поздний период.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </SheetBody>
          <SheetFooter>
            <Link to={ROUTES.wishlist.index} search={{ tab: 'planned' }} className="block">
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Открыть вишлист
              </Button>
            </Link>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PlanDateSheet
        item={rescheduleTarget}
        onOpenChange={(open2) => {
          if (!open2) setRescheduleTarget(null);
        }}
        onConfirm={(iso) => void confirmReschedule(iso)}
      />
    </>
  );
}
