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
  SlidingToggleGroup,
} from '@monesto/rune';
import { useEffect, useState } from 'react';

import { startOfDay } from '@/lib/calendar/workingDays';
import * as db from '@/lib/db';
import type { MoneyFlowCurrency } from '@/lib/types';
import {
  createEmptyExpenseEntry,
  createEmptyIncomeEntry,
  expensesToEntries,
  incomesToEntries,
  toIsoDate,
} from '@/lib/utils/format';

const numeric = (value: string) => Math.max(0, Number(value.replace(',', '.')) || 0);

function clampToInclusiveRange(date: Date, start: Date, end: Date): Date {
  const d = startOfDay(date);
  const s = startOfDay(start);
  const e = startOfDay(end);
  if (d < s) return s;
  if (d > e) return e;
  return d;
}

function dayBefore(date: Date): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() - 1);
  return next;
}

export function QuickOneTimeSheet({
  open,
  mode,
  onOpenChange,
  onDone,
  expenseStart,
  expenseEndExclusive,
}: {
  open: boolean;
  mode: 'income' | 'expense' | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  expenseStart: Date;
  expenseEndExclusive: Date;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<MoneyFlowCurrency>('rub');
  const [saving, setSaving] = useState(false);

  const isIncome = mode === 'income';
  const amountNum = numeric(amount);
  const canSave = Boolean(name.trim()) && amountNum > 0;

  useEffect(() => {
    if (!open) return;
    setName('');
    setAmount('');
    setCurrency('rub');
    setSaving(false);
  }, [open, mode]);

  const save = async () => {
    if (!mode || !canSave || saving) return;
    setSaving(true);
    try {
      const today = startOfDay(new Date());
      const specificDate = clampToInclusiveRange(
        today,
        expenseStart,
        dayBefore(expenseEndExclusive),
      );
      const specificDateIso = toIsoDate(specificDate);

      if (isIncome) {
        const entries = incomesToEntries(await db.getAllIncomes());
        entries.push({
          ...createEmptyIncomeEntry(),
          name: name.trim(),
          amount: String(amountNum),
          currency,
          isOneTime: true,
          specificDate: specificDateIso,
        });
        await db.replaceAllIncomes(entries);
      } else {
        const entries = expensesToEntries(await db.getAllExpenses());
        entries.push({
          ...createEmptyExpenseEntry(),
          name: name.trim(),
          amount: String(amountNum),
          currency,
          isOneTime: true,
          specificDate: specificDateIso,
        });
        await db.replaceAllExpenses(entries);
      }
      onOpenChange(false);
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open && mode != null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isIncome ? 'Разовый доход' : 'Разовый расход'}
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-500">
            Попадёт в открытый цикл. Дата подставится автоматически.
          </p>
          <div>
            <Label required>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isIncome ? 'Например, премия' : 'Например, ремонт'}
            />
          </div>
          <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label
                required
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Сумма
              </Label>
              <SlidingToggleGroup
                size="sm"
                value={currency}
                onValueChange={(key) =>
                  setCurrency(key as MoneyFlowCurrency)
                }
                options={[
                  { value: 'rub', label: '₽' },
                  { value: 'usd', label: '$' },
                ]}
              />
            </div>
            <Input
              format="money"
              suffix={currency === 'usd' ? '$' : '₽'}
              withRelativeSuffix
              className="border-0 bg-white text-lg font-bold shadow-none ring-1 ring-slate-200"
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
            disabled={!canSave || saving}
            onClick={() => void save()}
          >
            Добавить
          </Button>
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
