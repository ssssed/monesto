import {
  Button,
  DatePicker,
  Label,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@monesto/rune';
import { useEffect, useState } from 'react';

import type { WishlistItem } from '@/kernel/types';

export function PlanDateSheet({
  item,
  onOpenChange,
  onConfirm,
}: {
  item: WishlistItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (plannedDateIso: string) => void;
}) {
  const [date, setDate] = useState('');

  useEffect(() => {
    if (item) setDate(item.planned_date ?? '');
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
          <SheetTitle>Когда планируете купить?</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-500">
            «{item?.name}» переедет в «Запланировано» — периодически будем
            напоминать о ней на главном экране.
          </p>
          <div>
            <Label required>Период</Label>
            <DatePicker value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </SheetBody>
        <SheetFooter className="gap-2 sm:flex-col">
          <Button
            className="w-full"
            size="lg"
            disabled={!date}
            onClick={() => onConfirm(date)}
          >
            Запланировать
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
