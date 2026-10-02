import {
  Button,
  Input,
  Label,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  formatDateDisplay,
} from '@monesto/rune';
import { useEffect, useState } from 'react';

import type { WishlistItem } from '@/kernel/types';
import { numeric } from '@/shared/lib/layout';

export function PlannedExpenseConfirmSheet({
  item,
  onOpenChange,
  onConfirm,
}: {
  item: WishlistItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amountRub: number) => void;
}) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (item) setAmount(String(item.price ?? 0));
  }, [item]);

  return (
    <Sheet
      open={item != null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Потратить «{item?.name}»</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-500">
            {item?.planned_date
              ? `Попадёт разовым расходом на ${formatDateDisplay(item.planned_date)} — в цикл, который накроет эту дату. Сумму можно поправить.`
              : 'Попадёт разовым расходом сегодняшним числом. Сумму можно поправить.'}
          </p>
          <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
            <Label required className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Сумма
            </Label>
            <Input
              format="money"
              suffix="₽"
              withRelativeSuffix
              className="mt-2 border-0 bg-white text-lg font-bold shadow-none ring-1 ring-slate-200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </SheetBody>
        <SheetFooter className="gap-2 sm:flex-col">
          <Button
            className="w-full"
            size="lg"
            disabled={numeric(amount) <= 0}
            onClick={() => onConfirm(numeric(amount))}
          >
            Потратить
          </Button>
          <button
            type="button"
            className="w-full py-2 text-center text-sm font-medium text-slate-400"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
