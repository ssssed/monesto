import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { PageHeader } from '@/components/layout/PageHeader';
import { MoneyFlowStep } from '@/components/money-flow/MoneyFlowStep';
import * as db from '@/lib/db';
import type { MoneyFlowEntry } from '@/lib/types';
import {
  expensesToEntries,
  incomesToEntries,
} from '@/lib/utils/format';
import { formShell } from '@/screens/shared';

export function MoneyFlowScreen({
  mode,
  onboarding,
  preview = false,
  cycleKey,
}: {
  mode: 'income' | 'expense';
  onboarding?: boolean;
  preview?: boolean;
  cycleKey?: string;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const [entries, setEntries] = useState<MoneyFlowEntry[] | null>(null);
  const [entriesKey, setEntriesKey] = useState(0);

  const loadEntries = useCallback(async () => {
    if (mode === 'income') {
      const rows = await db.getAllIncomes();
      const mapped = incomesToEntries(rows);
      flushSync(() => {
        setEntries(mapped);
        setEntriesKey((key) => key + 1);
      });
      return mapped;
    }
    const rows = await db.getAllExpenses();
    const mapped = expensesToEntries(rows);
    flushSync(() => {
      setEntries(mapped);
      setEntriesKey((key) => key + 1);
    });
    return mapped;
  }, [mode]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries, preview]);

  if (!entries) {
    return (
      <main className={`${formShell} overflow-hidden`}>
        <p className="text-slate-400">Загрузка…</p>
      </main>
    );
  }

  const submit = async (next: MoneyFlowEntry[]) => {
    if (mode === 'income') await db.replaceAllIncomes(next);
    else await db.replaceAllExpenses(next);

    await loadEntries();

    if (onboarding && mode === 'income') {
      await navigate({ to: '/onboarding/expenses' });
      return;
    }
    if (onboarding && mode === 'expense') {
      await db.completeOnboarding();
      await navigate({ to: '/' });
      return;
    }
    if (canGoBack) {
      router.history.back();
      return;
    }
    await navigate({ to: '/settings' });
  };

  return (
    <main className={`${formShell} overflow-hidden`}>
      {!onboarding ? (
        <PageHeader
          title={mode === 'income' ? 'Доходы' : 'Расходы'}
          backTo="/settings"
        />
      ) : null}
      <div className="min-h-0 flex-1">
        <MoneyFlowStep
          key={`${preview ? 'preview' : 'edit'}-${entriesKey}`}
          mode={mode}
          onboarding={onboarding}
          preview={preview && !onboarding}
          cycleKey={cycleKey}
          title={mode === 'income' ? 'Ваши доходы' : 'Обязательные расходы'}
          subtitle={
            onboarding
              ? mode === 'income'
                ? 'Укажите зарплату и другие поступления'
                : 'Регулярные платежи до распределения в активы'
              : undefined
          }
          initialEntries={entries}
          submitLabel={
            onboarding
              ? mode === 'income'
                ? 'Далее'
                : 'Готово'
              : 'Сохранить'
          }
          onSubmit={submit}
        />
      </div>
    </main>
  );
}