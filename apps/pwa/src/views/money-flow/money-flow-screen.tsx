import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { PageHeader } from '@/shared/ui/page-header';
import { MoneyFlowStep } from './ui/money-flow-step';
import * as db from '@/kernel/db';
import type { MoneyFlowEntry } from '@/kernel/types';
import { expensesToEntries, incomesToEntries } from '@/entities/report';
import { formShell } from '@/shared/lib/layout';
import { ROUTES } from '@/shared/config/routes';

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
      await navigate({ to: ROUTES.onboarding.expenses });
      return;
    }
    if (onboarding && mode === 'expense') {
      await db.completeOnboarding();
      await navigate({ to: ROUTES.home });
      return;
    }
    if (canGoBack) {
      router.history.back();
      return;
    }
    await navigate({ to: ROUTES.settings.index });
  };

  return (
    <main className={`${formShell} overflow-hidden`}>
      {!onboarding ? (
        <PageHeader
          title={mode === 'income' ? 'Доходы' : 'Расходы'}
          backTo={ROUTES.settings.index}
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