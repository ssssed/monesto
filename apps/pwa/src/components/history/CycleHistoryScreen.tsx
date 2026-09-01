import { useEffect, useState } from 'react';

import { PageHeader, PageTitle } from '@/components/layout/PageHeader';
import { FadeIn } from '@/components/ui/FadeIn';
import * as db from '@/lib/db';
import {
  computeCycleHistory,
  type CycleHistoryPoint,
} from '@/lib/report/computeCycleHistory';
import { formatRub } from '@/lib/utils/format';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

const nestedShell = 'mx-auto w-full px-5 pt-6 pb-10';

function CycleHistoryRow({
  point,
  maxValue,
}: {
  point: CycleHistoryPoint;
  maxValue: number;
}) {
  const incomeWidth = maxValue > 0 ? Math.max(2, (point.totalIncome / maxValue) * 100) : 0;
  const expenseWidth = maxValue > 0 ? Math.max(2, (point.totalExpenses / maxValue) * 100) : 0;
  const positive = point.remainder >= 0;

  return (
    <div className="rounded-2xl bg-white px-4 py-3.5 ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{point.label}</p>
        <p
          className={
            positive
              ? 'text-xs font-semibold tabular-nums text-emerald-600'
              : 'text-xs font-semibold tabular-nums text-rose-600'
          }
        >
          {positive ? '+' : ''}
          {formatRub(point.remainder)}
        </p>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[var(--color-income)]"
              style={{ width: `${incomeWidth}%` }}
            />
          </div>
          <p className="w-24 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
            {formatRub(point.totalIncome)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[var(--color-expense)]"
              style={{ width: `${expenseWidth}%` }}
            />
          </div>
          <p className="w-24 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
            {formatRub(point.totalExpenses)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CycleHistoryScreen() {
  const rate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;
  const [points, setPoints] = useState<CycleHistoryPoint[] | null>(null);

  useEffect(() => {
    void Promise.all([
      db.getAllIncomes(),
      db.getAllExpenses(),
      db.getAllRules(),
      db.getAllAssets(),
      db.getAllVacations(),
    ]).then(([incomes, expenses, rules, assets, vacations]) => {
      setPoints(
        computeCycleHistory({
          incomes,
          expenses,
          rules,
          assets,
          vacations,
          today: new Date(),
          usdRubRate: rate,
          monthsBack: 6,
          trackingStartedAt: db.getTrackingStartedAtSync(),
        }),
      );
    });
  }, [rate]);

  if (!points) {
    return (
      <main className={nestedShell}>
        <PageHeader title="История циклов" backTo="/" />
        <p className="text-slate-400">Считаем историю…</p>
      </main>
    );
  }

  const maxValue = points.reduce(
    (max, p) => Math.max(max, p.totalIncome, p.totalExpenses),
    0,
  );
  const avgIncome = points.length
    ? points.reduce((sum, p) => sum + p.totalIncome, 0) / points.length
    : 0;
  const avgExpenses = points.length
    ? points.reduce((sum, p) => sum + p.totalExpenses, 0) / points.length
    : 0;

  return (
    <main className={`${nestedShell} space-y-4`}>
      <PageHeader title="История циклов" backTo="/" />
      <PageTitle
        title="Доходы и расходы по циклам"
        subtitle="За последние полгода, по уже наступившим циклам"
      />

      {points.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
          <p className="font-semibold text-slate-700">Пока нет истории</p>
          <p className="mx-auto mt-1.5 max-w-[260px] text-sm leading-snug text-slate-400">
            Она появится после первого завершённого цикла выплат
          </p>
        </div>
      ) : (
        <>
          <FadeIn variant="fade">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200/70 ring-1 ring-slate-200/80">
              <div className="bg-white px-4 py-4">
                <p className="text-[11px] font-medium text-slate-400">
                  Средний доход
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-[var(--color-income)]">
                  {formatRub(avgIncome)}
                </p>
              </div>
              <div className="bg-white px-4 py-4">
                <p className="text-[11px] font-medium text-slate-400">
                  Средний расход
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-[var(--color-expense)]">
                  {formatRub(avgExpenses)}
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="space-y-2.5">
            {[...points].reverse().map((point, i) => (
              <FadeIn key={point.cycleKey} index={i} baseDelay={40} step={35}>
                <CycleHistoryRow point={point} maxValue={maxValue} />
              </FadeIn>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
