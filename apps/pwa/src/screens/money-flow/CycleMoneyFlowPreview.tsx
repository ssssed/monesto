import {
  Badge,
  Button,
  cn
} from '@monesto/rune';
import { useNavigate } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, Pencil, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import {
  reportCycleKey,
} from '@/components/report/ReportCycleSwitcher';
import {
  CarryoverEditSheet,
} from '@/components/report/CarryoverEditSheet';
import * as db from '@/lib/db';
import { calculateReport, isReportError } from '@/lib/report/calculateReport';
import {
  findPrimaryIncome,
  formatReportDate,
  listReportCycles,
  scheduleDaysFromPrimary,
} from '@/lib/report/dateWindow';
import type { ReportCycle } from '@/lib/report/dateWindow';
import { resolveCarryIn } from '@/lib/report/resolveCarryIn';
import type { CarryInResult } from '@/lib/report/resolveCarryIn';
import type {
  Expense,
  IncomeSource,
  ReportResult,
} from '@/lib/types';
import {
  formatRub,
} from '@/lib/utils/format';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';
import { formShell, numeric } from '@/screens/shared';

export function CycleMoneyFlowPreview({
  mode,
  cycleKey,
}: {
  mode: 'income' | 'expense';
  cycleKey?: string;
}) {
  const navigate = useNavigate();
  const rate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;
  const [carryTick, setCarryTick] = useState(0);
  const [carryEditOpen, setCarryEditOpen] = useState(false);
  const [carryDraft, setCarryDraft] = useState('');
  const [state, setState] = useState<{
    cycle: ReportCycle;
    report: ReportResult;
    incomes: IncomeSource[];
    expenses: Expense[];
    carryIn: CarryInResult;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [incomes, expenses, rules, assets, vacations] = await Promise.all([
        db.getAllIncomes(),
        db.getAllExpenses(),
        db.getAllRules(),
        db.getAllAssets(),
        db.getAllVacations(),
      ]);
      const primary = findPrimaryIncome(incomes);
      const vacationCtx =
        primary?.income_kind === 'bimonthly_salary'
          ? {
              vacations,
              monthlyAmount: primary.monthly_amount ?? 0,
              tranches: primary.salary_tranches,
            }
          : undefined;
      const today = new Date();
      const scheduleDays = scheduleDaysFromPrimary(primary);
      const cycles = listReportCycles(today, scheduleDays, vacationCtx);
      const cycle =
        (cycleKey
          ? cycles.find((c) => reportCycleKey(c) === cycleKey)
          : undefined) ??
        cycles.find((c) => !c.isPreview) ??
        cycles[0] ??
        null;
      if (!cycle || cancelled) return;

      const trackingAnchor = cycles.find((c) => !c.isPreview) ?? cycles[0] ?? cycle;
      const trackingStartedAt = db.ensureTrackingStartedAt(trackingAnchor.nominalDate);

      const carryIn = resolveCarryIn({
        today,
        cycle,
        scheduleDays,
        vacationCtx,
        incomes,
        expenses,
        rules,
        assets,
        vacations,
        usdRubRate: rate,
        getOverride: db.getCarryoverOverrideSync,
        getRejectedIds: db.getRejectedRuleIdsSync,
        trackingStartedAt,
      });

      const report = calculateReport({
        incomes,
        expenses,
        rules,
        assets,
        vacations,
        today,
        cyclePaymentDay: cycle.paymentDay,
        cycleNominalDate: cycle.nominalDate,
        usdRubRate: rate,
        carryInRub: carryIn.amountRub,
      });

      if (cancelled || isReportError(report)) return;
      setState({ cycle, report, incomes, expenses, carryIn });
    })();
    return () => {
      cancelled = true;
    };
  }, [cycleKey, rate, carryTick]);

  const isIncome = mode === 'income';

  if (!state) {
    return (
      <main className={`${formShell} overflow-hidden`}>
        <PageHeader title={isIncome ? 'Доходы' : 'Расходы'} backTo="/" />
        <p className="text-slate-400">Считаем…</p>
      </main>
    );
  }

  const { cycle, report, incomes, expenses, carryIn } = state;
  const lines = (
    isIncome ? report.incomeLines : report.expenseLines
  ).filter((line) => !('kind' in line && line.kind === 'carryover'));
  const total = isIncome ? report.totalIncome : report.totalExpenses;
  const carryEditable = !cycle.isPreview;
  const showCarryCard =
    isIncome &&
    carryIn.hasPreviousCycle &&
    (carryIn.amountRub > 0 || carryIn.isOverride);

  const toneSoft = isIncome
    ? 'bg-[var(--color-income-soft)] text-[var(--color-income)]'
    : 'bg-[var(--color-expense-soft)] text-[var(--color-expense)]';
  const toneMoneyText = isIncome
    ? 'text-[var(--color-income)]'
    : 'text-[var(--color-expense)]';

  return (
    <main className={`${formShell} overflow-hidden`}>
      <PageHeader title={isIncome ? 'Доходы' : 'Расходы'} backTo="/" />
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-1 pt-1 pb-4">
        <div>
          <h2 className="text-[1.75rem] font-bold tracking-tight text-slate-900">
            {isIncome ? 'Доходы' : 'Расходы'} к {formatReportDate(cycle.payoutDate)}
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-400">
            {isIncome ? 'Поступления в этом цикле' : 'Платежи в этом цикле'}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--color-navy)] p-5 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {isIncome ? 'Доходы в цикле' : 'Расходы в цикле'}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {formatRub(total)}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3.5 ring-1 ring-blue-100">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {isIncome ? 'Изменить доходы' : 'Изменить расходы'}
            </p>
            <p className="mt-0.5 text-[12px] leading-4 text-slate-500">
              {isIncome
                ? 'Отредактируйте источники или добавьте новые поступления'
                : 'Отредактируйте платежи или добавьте новые расходы'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            onClick={() =>
              void navigate({
                to: isIncome ? '/settings/income' : '/settings/expenses',
                search: {},
              })
            }
          >
            <Pencil className="h-3.5 w-3.5" />
            Изменить
          </Button>
        </div>

        <h3 className="text-sm font-semibold text-slate-900">
          {isIncome ? 'Источники' : 'Статьи'}
        </h3>

        <div>
          {showCarryCard ? (
            (() => {
              const detail = carryEditable
                ? carryIn.isOverride
                  ? 'изменено вручную · нажмите, чтобы изменить'
                  : 'нажмите, чтобы изменить'
                : 'в плане менять нельзя';
              const inner = (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Wallet className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-slate-900">
                      Остаток с прошлого цикла
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-amber-700">
                      {formatRub(carryIn.amountRub)} · {detail}
                    </p>
                  </div>
                </>
              );
              return carryEditable ? (
                <button
                  type="button"
                  onClick={() => {
                    setCarryDraft(String(carryIn.amountRub || ''));
                    setCarryEditOpen(true);
                  }}
                  className="mb-3 flex w-full items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3.5 text-left ring-1 ring-amber-100 transition-colors hover:bg-amber-100/70"
                >
                  {inner}
                </button>
              ) : (
                <div className="mb-3 flex w-full items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-100">
                  {inner}
                </div>
              );
            })()
          ) : null}

          {lines.length === 0 && !showCarryCard ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              {isIncome ? 'Нет доходов в этом цикле' : 'Нет расходов в этом цикле'}
            </p>
          ) : (
            lines.map((line, i) => {
              const source = isIncome
                ? incomes.find((inc) => inc.name === line.name)
                : expenses.find((exp) => exp.name === line.name);
              const isPrimary = isIncome && (source as IncomeSource | undefined)?.is_primary;
              const isCredit =
                !isIncome && (source as Expense | undefined)?.linked_asset_id != null;
              const salarySource =
                isIncome &&
                (source as IncomeSource | undefined)?.income_kind === 'bimonthly_salary'
                  ? (source as IncomeSource)
                  : undefined;
              const monthlyHint = salarySource?.monthly_amount
                ? ` · вся зарплата ${formatRub(
                    salarySource.currency === 'usd'
                      ? salarySource.monthly_amount * rate
                      : salarySource.monthly_amount,
                  )}`
                : '';

              return (
                <div
                  key={`${line.name}-${i}`}
                  className="mb-3 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100"
                >
                  <div className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        toneSoft,
                      )}
                    >
                      {isIncome ? (
                        <ArrowDown className="h-[18px] w-[18px]" strokeWidth={2} />
                      ) : (
                        <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900">
                          {line.name}
                        </p>
                        {isPrimary ? (
                          <Badge variant="soft" className="shrink-0 text-[10px]">
                            ОСН.
                          </Badge>
                        ) : null}
                        {isCredit ? (
                          <Badge
                            variant="soft"
                            className="shrink-0 text-[10px] text-rose-700"
                          >
                            КРЕДИТ
                          </Badge>
                        ) : null}
                      </div>
                      <p className={cn('mt-0.5 truncate text-sm font-medium', toneMoneyText)}>
                        {formatRub(line.amount)}
                        {line.detail ? ` · ${line.detail}` : ''}
                        {monthlyHint}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CarryoverEditSheet
        open={carryEditOpen}
        onOpenChange={(open) => {
          setCarryEditOpen(open);
          if (!open) setCarryDraft('');
        }}
        suggestedRub={carryIn.suggestedRub}
        isOverride={carryIn.isOverride}
        draft={carryDraft}
        onDraftChange={setCarryDraft}
        onSave={() => {
          void db.setCarryoverOverride(report.cycleKey, numeric(carryDraft)).then(() => {
            setCarryTick((n) => n + 1);
            setCarryEditOpen(false);
          });
        }}
        onReset={() => {
          void db.clearCarryoverOverride(report.cycleKey).then(() => {
            setCarryTick((n) => n + 1);
            setCarryEditOpen(false);
          });
        }}
      />
    </main>
  );
}