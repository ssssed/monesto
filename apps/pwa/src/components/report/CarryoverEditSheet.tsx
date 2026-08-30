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
} from '@monesto/rune';
import { Pencil, Wallet } from 'lucide-react';

import { formatRub } from '@/lib/utils/format';

export function CarryoverIncomeCard({
  amountRub,
  isOverride,
  onEdit,
  editable = true,
}: {
  amountRub: number;
  isOverride: boolean;
  onEdit?: () => void;
  editable?: boolean;
}) {
  const body = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <Wallet className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">Остаток с прошлого цикла</p>
        <p className="text-sm text-slate-500">
          {editable
            ? isOverride
              ? 'Изменён вручную · нажмите, чтобы править'
              : 'Свободные деньги прошлого цикла · нажмите, чтобы править'
            : 'В плане менять нельзя — к этому периоду сумма ещё может измениться'}
        </p>
      </div>
      <p className="shrink-0 text-base font-bold tabular-nums text-amber-800">
        {formatRub(amountRub)}
      </p>
      {editable ? (
        <Pencil className="h-4 w-4 shrink-0 text-amber-600/70" />
      ) : null}
    </>
  );

  if (!editable) {
    return (
      <div className="flex w-full items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3.5 text-left">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3.5 text-left transition-colors hover:bg-amber-100/70"
    >
      {body}
    </button>
  );
}

export function CarryoverEditSheet({
  open,
  onOpenChange,
  suggestedRub,
  isOverride,
  draft,
  onDraftChange,
  onSave,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedRub: number;
  isOverride: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Остаток с прошлого цикла</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-500">
            Свободные деньги прошлого цикла учитываются как доход в текущем.
            Можно поправить сумму, если фактический остаток другой.
          </p>
          <p className="text-sm text-slate-400">
            По расчёту · {formatRub(suggestedRub)}
          </p>
          <div className="space-y-2">
            <Label htmlFor="carry-amount">Сумма, ₽</Label>
            <Input
              id="carry-amount"
              inputMode="decimal"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="0"
            />
          </div>
        </SheetBody>
        <SheetFooter className="gap-2 sm:flex-col">
          <Button className="w-full" onClick={onSave}>
            Сохранить
          </Button>
          {isOverride ? (
            <Button variant="secondary" className="w-full" onClick={onReset}>
              Вернуть расчёт · {formatRub(suggestedRub)}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
