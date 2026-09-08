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
import { useEffect, useState } from 'react';

import { formatRub } from '@/lib/utils/format';

export function CarryInWizardSheet({
  open,
  onOpenChange,
  suggestedRub,
  onConfirmSuggested,
  onSaveCustom,
  onSkip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedRub: number;
  onConfirmSuggested: () => void;
  onSaveCustom: (amountRub: number) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<'ask' | 'custom'>('ask');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (open) {
      setStep('ask');
      setDraft(String(suggestedRub || ''));
    }
  }, [open, suggestedRub]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {step === 'ask' ? 'Сверка с картой' : 'Сколько осталось?'}
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          {step === 'ask' ? (
            <>
              <p className="text-sm leading-relaxed text-slate-500">
                С прошлого цикла свободно {formatRub(suggestedRub)}. Это похоже
                на то, что реально осталось на карте?
              </p>
              <div className="rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-100">
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                  По расчёту
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-amber-900">
                  {formatRub(suggestedRub)}
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-slate-500">
                Введите фактический остаток — подставим его как перенос в этот
                цикл.
              </p>
              <div className="space-y-2">
                <Label htmlFor="carry-wizard-amount">На карте осталось, ₽</Label>
                <Input
                  id="carry-wizard-amount"
                  inputMode="decimal"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </div>
            </>
          )}
        </SheetBody>
        <SheetFooter className="gap-2 sm:flex-col">
          {step === 'ask' ? (
            <>
              <Button className="w-full" size="lg" onClick={onConfirmSuggested}>
                Да, всё так
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setStep('custom')}
              >
                Нет, поправлю сумму
              </Button>
              <Button variant="ghost" className="w-full" onClick={onSkip}>
                Позже
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  const amount = Math.max(
                    0,
                    Number(draft.replace(',', '.')) || 0,
                  );
                  onSaveCustom(amount);
                }}
              >
                Сохранить
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep('ask')}
              >
                Назад
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
