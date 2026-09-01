import {
  Badge,
  Button,
  Card,
  cn,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SlidingToggleGroup,
  Tabs,
  TabsList,
  TabsTrigger
} from '@monesto/rune';
import { Link, useCanGoBack, useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  GitBranch,
  History,
  Minus,
  Pencil,
  Plus,
  Receipt,
  TrendingUp,
  Upload,
  Wallet
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { flushSync } from 'react-dom';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { AssetReorderHandle } from '@/components/assets/AssetReorderHandle';
import { AssetStylePicker } from '@/components/assets/AssetStylePicker';
import { CreditDetailScreen } from '@/components/credit/CreditDetailScreen';
import { PageHeader, PageTitle } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { MoneyFlowStep } from '@/components/money-flow/MoneyFlowStep';
import {
  ReportCycleSwitcher,
  reportCycleKey,
} from '@/components/report/ReportCycleSwitcher';
import {
  CarryoverEditSheet,
  CarryoverIncomeCard,
} from '@/components/report/CarryoverEditSheet';
import { QuickOneTimeSheet } from '@/components/report/QuickOneTimeSheet';
import { SwipeConfirmCard } from '@/components/report/SwipeConfirmCard';
import { DangerClearButton } from '@/components/ui/DangerClearButton';
import { AppAboutFooter } from '@/components/ui/AppAboutFooter';
import { ExchangeRateBadge } from '@/components/ui/ExchangeRateBadge';
import { FadeIn } from '@/components/ui/FadeIn';
import { ErrorPage } from '@/components/ui/ErrorPage';
import { GoalProgressBadge, TrendBadge } from '@/components/ui/GoalProgressBadge';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { UndoToast } from '@/components/ui/UndoToast';
import { VacationBanner } from '@/components/vacation/VacationBanner';
import { YearSummaryBanner } from '@/components/year-summary/YearSummaryBanner';
import * as db from '@/lib/db';
import { isYearSummaryEnabled, shouldShowVacationBanner } from '@/lib/features';
import {
  computeYearSummary,
  type YearSummary,
} from '@/lib/year-summary/computeYearSummary';
import { calcUsdValuation } from '@/lib/exchange/usdValuation';
import {
  contractualAnnuityPayment,
  creditRemainingMonthsFromSchedule,
  creditRepaidRatio,
  isExistingCreditLoan,
} from '@/lib/credit/plan';
import type { AssetIconName } from '@/lib/providers/assetIcons';
import {
  ASSET_PROVIDERS,
  CREDIT_DEFAULTS,
  getEnabledProviders,
} from '@/lib/providers/assetProviders';
import { calculateReport, isReportError } from '@/lib/report/calculateReport';
import { computeCycleHistory } from '@/lib/report/computeCycleHistory';
import {
  findPrimaryIncome,
  formatReportDate,
  listReportCycles,
  scheduleDaysFromPrimary,
} from '@/lib/report/dateWindow';
import type { ReportCycle } from '@/lib/report/dateWindow';
import { resolveCarryIn } from '@/lib/report/resolveCarryIn';
import type { CarryInResult } from '@/lib/report/resolveCarryIn';
import {
  freeRulesPercent,
  summarizeDraftRulesBudget,
  summarizeRulesBudget,
} from '@/lib/report/rulesBudget';
import type {
  Asset,
  DistributionRule,
  Expense,
  IncomeSource,
  MoneyFlowEntry,
  ReportResult,
  RuleType,
  VacationPeriod,
} from '@/lib/types';
import {
  createEmptyExpenseEntry,
  expensesToEntries,
  formatRub,
  formatUsd,
  incomesToEntries,
  toIsoDate,
} from '@/lib/utils/format';
import { startOfDay } from '@/lib/calendar/workingDays';
import { assetSlug } from '@/lib/utils/slug';
import { useCycleSelectionStore } from '@/stores/cycle-selection-store';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

const shell = 'mx-auto w-full px-5 pt-6 pb-[110px]';

function FreeMoneyQuickActions({
  onIncome,
  onExpense,
  disabled,
}: {
  onIncome: () => void;
  onExpense: () => void;
  disabled?: boolean;
}) {
  const colRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(56);

  useLayoutEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const update = () => {
      const gap = 8;
      setSide(Math.max(44, Math.round((el.clientHeight - gap) / 2)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={colRef}
      className="flex shrink-0 flex-col gap-2 self-stretch"
      style={{ width: side }}
    >
      <button
        type="button"
        aria-label="Добавить разовый доход"
        onClick={onIncome}
        disabled={disabled}
        className="flex shrink-0 items-center justify-center rounded-2xl bg-[var(--color-navy)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 disabled:hover:scale-100"
        style={{ width: side, height: side }}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label="Добавить разовый расход"
        onClick={onExpense}
        disabled={disabled}
        className="flex shrink-0 items-center justify-center rounded-2xl bg-[var(--color-navy)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 disabled:hover:scale-100"
        style={{ width: side, height: side }}
      >
        <Minus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function paymentsLabel(count: number): string {

  if (count === 0) return 'Нет платежей';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} платеж`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} платежа`;
  }
  return `${count} платежей`;
}

function uniqueLineNames(lines: { name: string }[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of lines) {
    if (seen.has(line.name)) continue;
    seen.add(line.name);
    names.push(line.name);
  }
  return names;
}

const nestedShell = 'mx-auto w-full px-5 pt-6 pb-8';
const formShell = 'mx-auto flex h-full min-h-0 w-full flex-col px-5 pt-6';
const formScroll =
  'min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-4';
const UNDO_MS = 7000;
const defaults = {
  icon: 'wallet' as AssetIconName,
  bgColor: '#DBEAFE',
  iconColor: '#2563EB'
};
const numeric = (value: string) => Math.max(0, Number(value.replace(',', '.')) || 0);

export function HomeScreen() {
  const [data, setData] = useState<{
    assets: Asset[];
    incomes: Awaited<ReturnType<typeof db.getAllIncomes>>;
    expenses: Awaited<ReturnType<typeof db.getAllExpenses>>;
    rules: DistributionRule[];
    vacations: VacationPeriod[];
  } | null>(null);
  const cycleKey = useCycleSelectionStore((s) => s.cycleKey);
  const setCycleKey = useCycleSelectionStore((s) => s.setCycleKey);
  const [confirmedIds, setConfirmedIds] = useState<number[]>([]);
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);
  const [yearSummary, setYearSummary] = useState<YearSummary | null>(null);
  const [carryTick, setCarryTick] = useState(0);
  const [carryEditOpen, setCarryEditOpen] = useState(false);
  const [carryDraft, setCarryDraft] = useState('');
  const [trackingStartedAt, setTrackingStartedAt] = useState<Date | null>(null);
  const [quickOneTimeMode, setQuickOneTimeMode] = useState<
    'income' | 'expense' | null
  >(null);
  const rate = useExchangeRateStore((s) => s.usdRubRate);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const reload = useCallback(async () => {
    const [assets, incomes, expenses, rules, vacations] = await Promise.all([
      db.getAllAssets(),
      db.getAllIncomes(),
      db.getAllExpenses(),
      db.getAllRules(),
      db.getAllVacations(),
    ]);
    setData({ assets, incomes, expenses, rules, vacations });

    if (isYearSummaryEnabled()) {
      const transactions = await db.getAllAssetTransactions();
      setYearSummary(
        computeYearSummary({
          assets,
          transactions,
          usdRubRate: rate ?? 82,
        }),
      );
    } else {
      setYearSummary(null);
    }
  }, [rate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (pathname === '/') void reload();
  }, [pathname, reload]);

  const vacationCtx = useMemo(() => {
    if (!data) return undefined;
    const primary = findPrimaryIncome(data.incomes);
    if (primary?.income_kind !== 'bimonthly_salary') return undefined;
    return {
      vacations: data.vacations,
      monthlyAmount: primary.monthly_amount ?? 0,
      tranches: primary.salary_tranches,
    };
  }, [data]);

  const cycles = useMemo(() => {
    if (!data) return [];
    const primary = findPrimaryIncome(data.incomes);
    return listReportCycles(
      new Date(),
      scheduleDaysFromPrimary(primary),
      vacationCtx,
    );
  }, [data, vacationCtx]);

  const selectedCycle =
    cycles.find((c) => reportCycleKey(c) === cycleKey) ??
    cycles.find((c) => !c.isPreview) ??
    cycles[0] ??
    null;
  const selectedKey = selectedCycle ? reportCycleKey(selectedCycle) : '';

  useEffect(() => {
    if (
      cycleKey != null &&
      cycles.length &&
      !cycles.some((c) => reportCycleKey(c) === cycleKey)
    ) {
      setCycleKey(null);
    }
  }, [cycles, cycleKey]);

  useEffect(() => {
    const anchor =
      cycles.find((c) => !c.isPreview) ?? cycles[0] ?? null;
    if (!anchor) {
      setTrackingStartedAt(db.getTrackingStartedAtSync());
      return;
    }
    setTrackingStartedAt(db.ensureTrackingStartedAt(anchor.nominalDate));
  }, [cycles]);

  const carryIn = useMemo(() => {
    if (!data || !selectedCycle) return null;
    const primary = findPrimaryIncome(data.incomes);
    return resolveCarryIn({
      today: new Date(),
      cycle: selectedCycle,
      scheduleDays: scheduleDaysFromPrimary(primary),
      vacationCtx,
      incomes: data.incomes,
      expenses: data.expenses,
      rules: data.rules,
      assets: data.assets,
      vacations: data.vacations,
      usdRubRate: rate ?? 82,
      getOverride: db.getCarryoverOverrideSync,
      getRejectedIds: db.getRejectedRuleIdsSync,
      trackingStartedAt,
    });
  }, [data, selectedCycle, vacationCtx, rate, carryTick, trackingStartedAt]);

  const report = useMemo(() => {
    if (!data || !selectedCycle || !carryIn) return null;
    return calculateReport({
      incomes: data.incomes,
      expenses: data.expenses,
      rules: data.rules,
      assets: data.assets,
      vacations: data.vacations,
      today: new Date(),
      cyclePaymentDay: selectedCycle.paymentDay,
      cycleNominalDate: selectedCycle.nominalDate,
      usdRubRate: rate ?? 82,
      carryInRub: carryIn.amountRub,
    });
  }, [data, selectedCycle, rate, carryIn]);

  const reportBare = useMemo(() => {
    if (!data || !selectedCycle) return null;
    return calculateReport({
      incomes: data.incomes,
      expenses: data.expenses,
      rules: data.rules,
      assets: data.assets,
      vacations: data.vacations,
      today: new Date(),
      cyclePaymentDay: selectedCycle.paymentDay,
      cycleNominalDate: selectedCycle.nominalDate,
      usdRubRate: rate ?? 82,
      carryInRub: 0,
    });
  }, [data, selectedCycle, rate]);

  useEffect(() => {
    if (!report || isReportError(report)) return;
    void Promise.all([
      db.getConfirmedRuleIds(report.cycleKey),
      db.getRejectedRuleIds(report.cycleKey)
    ]).then(([c, r]) => {
      setConfirmedIds(c);
      setRejectedIds(r);
    });
  }, [report]);

  if (!data) {
    return <main className={shell}>Считаем отчёт…</main>;
  }

  if (!cycles.length) {
    return (
      <main className={shell}>
        <p className="text-xl font-black tracking-[0.18em] text-blue-600">MONESTO</p>
        <PageTitle
          title="Нет ближайших выплат"
          subtitle="Проверьте доходы и периоды отпуска в настройках"
        />
        <Link to="/settings/vacation">
          <Button className="w-full">Открыть отпуск</Button>
        </Link>
      </main>
    );
  }

  if (!report) {
    return <main className={shell}>Считаем отчёт…</main>;
  }

  if (isReportError(report)) {
    return (
      <main className={shell}>
        <p className="text-xl font-black tracking-[0.18em] text-blue-600">MONESTO</p>
        <PageTitle title="Нужна настройка" subtitle={report.message} />
        <Link to="/settings/income">
          <Button className="w-full">Настроить доходы</Button>
        </Link>
      </main>
    );
  }

  const allocationsByAsset = (() => {
    const map = new Map<number, typeof report.allocations>();
    for (const allocation of report.allocations) {
      if (allocation.targetAssetId == null) continue;
      const list = map.get(allocation.targetAssetId) ?? [];
      list.push(allocation);
      map.set(allocation.targetAssetId, list);
    }
    return map;
  })();

  /** Отклонённые правила не едят свободные деньги; pending + принятые — да. */
  const effectiveAllocatedRub = report.allocations
    .filter((item) => !rejectedIds.includes(item.ruleId))
    .reduce((sum, item) => sum + item.amountRub, 0);
  const freeMoney = report.remainder - effectiveAllocatedRub;
  const freeBare =
    reportBare && !isReportError(reportBare)
      ? reportBare.remainder -
        reportBare.allocations
          .filter((item) => !rejectedIds.includes(item.ruleId))
          .reduce((sum, item) => sum + item.amountRub, 0)
      : freeMoney;
  const carryAmount = carryIn?.amountRub ?? 0;
  const showCarryWidget =
    Boolean(carryIn?.hasPreviousCycle) &&
    carryAmount > 0 &&
    !carryIn?.isOverride;

  const reportAssets = (report.assetSummary ?? []).filter(
    (asset) => (allocationsByAsset.get(asset.id) ?? []).length > 0
  );
  const rulesBudget = summarizeRulesBudget({
    remainder: Math.max(0, report.remainder - (report.carryInRub ?? 0)),
    rules: data.rules,
    assets: data.assets,
    usdRubRate: rate ?? 82,
  });
  const incomeNames = uniqueLineNames(report.incomeLines);
  const expenseCount = uniqueLineNames(report.expenseLines).length;
  const showVacationBanner = shouldShowVacationBanner(data.vacations);
  const vacationBannerIndex = 9 + Math.max(reportAssets.length, 1);
  const originStart = vacationBannerIndex + (showVacationBanner ? 1 : 0);

  const confirmAsset = async (assetId: number) => {
    if (report.isPreview) return;
    const allocations = allocationsByAsset.get(assetId) ?? [];
    const pending = allocations.filter(
      (item) => !confirmedIds.includes(item.ruleId) && !rejectedIds.includes(item.ruleId)
    );
    if (!pending.length) return;

    let totalRub = 0;
    const newlyConfirmed: number[] = [];
    for (const item of pending) {
      const status = await db.confirmAllocation({
        ruleId: item.ruleId,
        cycleKey: report.cycleKey,
        amountRub: item.amountRub
      });
      if (status === 'ok') {
        newlyConfirmed.push(item.ruleId);
        totalRub += item.amountRub;
        const target = data.assets.find((a) => a.id === assetId);
        const rule = data.rules.find((r) => r.id === item.ruleId);
        if (target?.provider === 'credit') {
          await db.depositFromAllocation(
            assetId,
            item.amountRub,
            rate ?? 82,
            'Погашение из отчёта',
            {
              earlyRepayMode:
                rule?.credit_early_repay_mode ??
                target.credit_early_repay_mode ??
                'reduce_term',
            },
          );
        }
      }
    }
    if (newlyConfirmed.length && totalRub > 0) {
      const target = data.assets.find((a) => a.id === assetId);
      if (target?.provider !== 'credit') {
        await db.depositFromAllocation(
          assetId,
          totalRub,
          rate ?? 82,
          'Распределение из отчёта',
        );
      }
    }
    setConfirmedIds((prev) => [...new Set([...prev, ...newlyConfirmed])]);
    await reload();
  };

  const rejectAsset = async (assetId: number) => {
    if (report.isPreview) return;
    const allocations = allocationsByAsset.get(assetId) ?? [];
    const pending = allocations.filter(
      (item) => !confirmedIds.includes(item.ruleId) && !rejectedIds.includes(item.ruleId)
    );
    const newlyRejected: number[] = [];
    for (const item of pending) {
      await db.rejectAllocation({
        ruleId: item.ruleId,
        cycleKey: report.cycleKey
      });
      newlyRejected.push(item.ruleId);
    }
    setRejectedIds((prev) => [...new Set([...prev, ...newlyRejected])]);
    await reload();
  };

  return (
    <main className={`${shell} space-y-4`}>
      <FadeIn variant="fade">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xl font-black tracking-[0.18em] text-blue-600">MONESTO</p>
          <ExchangeRateBadge compact />
        </div>
      </FadeIn>

      <FadeIn index={1}>
        <ReportCycleSwitcher
          cycles={cycles}
          selectedKey={selectedKey}
          onSelect={setCycleKey}
        />
      </FadeIn>

      <FadeIn index={2}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {report.isPreview ? 'План к' : 'Цикл к'} {formatReportDate(report.payoutDate)}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Текущий отчёт по доходам и расходам · выплата за {report.paymentDay}
            -е
          </p>
        </div>
      </FadeIn>

      {yearSummary ? (
        <FadeIn index={3}>
          <YearSummaryBanner summary={yearSummary} />
        </FadeIn>
      ) : null}

      <div className="space-y-3">
        <FadeIn index={0} baseDelay={180} step={140} variant="rise" durationClass="duration-700">
          <div className="flex items-stretch gap-3">
            <Card className="min-w-0 flex-1 border-0 bg-[var(--color-navy)] p-5 text-white shadow-lg">
              <p className="text-sm text-slate-300">Свободные деньги</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="break-words text-3xl font-bold leading-tight tracking-tight">
                  {showCarryWidget ? formatRub(freeBare) : formatRub(freeMoney)}
                </span>
                {showCarryWidget ? (
                  <span className="shrink-0 text-base font-semibold leading-snug text-amber-300">
                    + {formatRub(carryAmount)}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Распределение · {formatRub(effectiveAllocatedRub)}
              </p>
            </Card>
            <FreeMoneyQuickActions
              onIncome={() => setQuickOneTimeMode('income')}
              onExpense={() => setQuickOneTimeMode('expense')}
              disabled={report.isPreview}
            />
          </div>
        </FadeIn>

        {showCarryWidget ? (
          <FadeIn index={1} baseDelay={180} step={140} variant="rise" durationClass="duration-700">
            <CarryoverIncomeCard
              amountRub={carryAmount}
              isOverride={false}
              editable={!report.isPreview}
              onEdit={
                report.isPreview
                  ? undefined
                  : () => {
                      setCarryDraft(String(carryAmount || ''));
                      setCarryEditOpen(true);
                    }
              }
            />
          </FadeIn>
        ) : null}
      </div>

      <CarryoverEditSheet
        open={carryEditOpen && !report.isPreview}
        onOpenChange={(open) => {
          setCarryEditOpen(open);
          if (!open) setCarryDraft('');
        }}
        suggestedRub={carryIn?.suggestedRub ?? 0}
        isOverride={Boolean(carryIn?.isOverride)}
        draft={carryDraft}
        onDraftChange={setCarryDraft}
        onSave={() => {
          if (!report || isReportError(report)) return;
          void db
            .setCarryoverOverride(report.cycleKey, numeric(carryDraft))
            .then(() => {
              setCarryTick((n) => n + 1);
              setCarryEditOpen(false);
            });
        }}
        onReset={() => {
          if (!report || isReportError(report)) return;
          void db.clearCarryoverOverride(report.cycleKey).then(() => {
            setCarryTick((n) => n + 1);
            setCarryEditOpen(false);
          });
        }}
      />

      <QuickOneTimeSheet
        open={quickOneTimeMode != null}
        mode={quickOneTimeMode}
        expenseStart={selectedCycle.expenseStart}
        expenseEndExclusive={selectedCycle.expenseEndExclusive}
        onOpenChange={(open) => {
          if (!open) setQuickOneTimeMode(null);
        }}
        onDone={() => {
          void reload();
        }}
      />

      <section className="space-y-1">
        <FadeIn index={8} baseDelay={40} step={55}>
          <h2 className="font-bold text-slate-900">Что получат активы</h2>
          <p className="mb-3 text-xs leading-relaxed text-slate-400">
            {report.isPreview
              ? 'Сюда попадёт остаток после расходов по вашим правилам. В плане будущего цикла подтверждения ещё недоступны.'
              : 'Сюда попадает остаток после расходов — суммы по правилам распределения. Свайп вправо — применить, влево — отклонить.'}
          </p>
        </FadeIn>
        {(() => {
          if (!reportAssets.length) {
            const hasAnyAssets = data.assets.length > 0;
            return (
              <FadeIn index={9} baseDelay={40} step={55}>
                <Link
                  to={hasAnyAssets ? '/settings/rules/new' : '/assets/new'}
                  className="block"
                >
                  <Card className="border-slate-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          hasAnyAssets
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {hasAnyAssets ? (
                          <GitBranch className="h-5 w-5" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">
                          {hasAnyAssets
                            ? 'Запустите распределение'
                            : 'Создайте первый актив'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {hasAnyAssets
                            ? 'Добавьте правило — свободные деньги начнут поступать в активы'
                            : 'Без актива некуда направлять остаток после расходов'}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                    </div>
                  </Card>
                </Link>
              </FadeIn>
            );
          }

          return reportAssets.map((asset, i) => {
            const allocations = allocationsByAsset.get(asset.id) ?? [];
            const pendingForAsset = allocations.filter(
              (a) => !confirmedIds.includes(a.ruleId) && !rejectedIds.includes(a.ruleId)
            );
            const confirmedForAsset = allocations.filter((a) => confirmedIds.includes(a.ruleId));
            const rejectedForAsset = allocations.filter((a) => rejectedIds.includes(a.ruleId));
            const incoming = pendingForAsset.reduce((s, a) => s + a.amountRub, 0);
            const confirmedIncoming = confirmedForAsset.reduce((s, a) => s + a.amountRub, 0);
            const confirmed = confirmedForAsset.length > 0 && pendingForAsset.length === 0;
            const rejected =
              rejectedForAsset.length > 0 &&
              pendingForAsset.length === 0 &&
              confirmedForAsset.length === 0;
            const displayIncoming =
              pendingForAsset.length > 0 ? incoming : confirmed ? confirmedIncoming : 0;

            return (
              <FadeIn key={asset.id} index={9 + i} baseDelay={40} step={55}>
                <SwipeConfirmCard
                  title={asset.name}
                  balanceLabel={
                    asset.provider === 'credit'
                      ? `Долг ${formatRub(asset.nativeAmount)}`
                      : asset.provider === 'usd'
                        ? `${formatUsd(asset.nativeAmount)} · ${formatRub(asset.rubEquivalent)}`
                        : formatRub(asset.nativeAmount)
                  }
                  incomingRub={displayIncoming}
                  incomingLabel={
                    asset.provider === 'credit' ? 'к погашению' : undefined
                  }
                  icon={asset.icon}
                  bgColor={asset.bg_color}
                  iconColor={asset.icon_color}
                  confirmed={confirmed}
                  rejected={rejected}
                  swipeable={!report.isPreview}
                  onConfirm={() => void confirmAsset(asset.id)}
                  onReject={() => void rejectAsset(asset.id)}
                />
              </FadeIn>
            );
          });
        })()}
      </section>

      {showVacationBanner ? (
        <FadeIn index={vacationBannerIndex} baseDelay={40} step={55}>
          <VacationBanner />
        </FadeIn>
      ) : null}

      <section className="space-y-3">
        <FadeIn index={originStart} baseDelay={40} step={55}>
          <h2 className="font-bold text-slate-900">Откуда взялось</h2>
        </FadeIn>

        <div className="grid grid-cols-2 items-stretch gap-3">
          <FadeIn
            index={originStart + 1}
            baseDelay={40}
            step={55}
            variant="rise"
            durationClass="duration-700"
            className="h-full"
          >
            <Link
              to="/settings/income"
              search={{ _cycle: selectedKey }}
              className="block h-full"
            >
              <Card className="flex h-full flex-col border border-[var(--color-income)]/20 bg-[var(--color-income-soft)] p-4 shadow-none">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-income)]">
                  Доходы
                </p>
                <p className="mt-1 text-lg font-bold text-[var(--color-income)]">
                  {formatRub(report.totalIncome)}
                </p>
                <p className="mt-2 truncate text-[11px] leading-4 text-emerald-700/75">
                  {incomeNames.length ? incomeNames.join(' · ') : 'Нет доходов в цикле'}
                </p>
              </Card>
            </Link>
          </FadeIn>
          <FadeIn
            index={originStart + 2}
            baseDelay={40}
            step={55}
            variant="rise"
            durationClass="duration-700"
            className="h-full"
          >
            <Link
              to="/settings/expenses"
              search={{ _cycle: selectedKey }}
              className="block h-full"
            >
              <Card className="flex h-full flex-col border border-[var(--color-expense)]/20 bg-[var(--color-expense-soft)] p-4 shadow-none">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-expense)]">
                  Расходы
                </p>
                <p className="mt-1 text-lg font-bold text-[var(--color-expense)]">
                  {formatRub(report.totalExpenses)}
                </p>
                <p className="mt-2 text-[11px] leading-4 text-rose-700/75">
                  {paymentsLabel(expenseCount)}
                </p>
              </Card>
            </Link>
          </FadeIn>
        </div>

        <FadeIn
          index={originStart + 3}
          baseDelay={40}
          step={55}
          variant="rise"
          durationClass="duration-700"
        >
          <Link to="/settings/rules" className="block">
            <Card className="border-slate-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">Правила распределения</p>
                  <p className="text-sm text-slate-400">
                    {rulesBudget.overBudget
                      ? `Занято ${rulesBudget.totalPercent.toFixed(1)}% — перебор`
                      : `Занято ${rulesBudget.totalPercent.toFixed(1)}% остатка`}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
              </div>
            </Card>
          </Link>
        </FadeIn>
      </section>
    </main>
  );
}

export function AssetsScreen() {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [toast, setToast] = useState<{ assetId: number; name: string } | null>(null);
  const pendingRef = useRef(
    new Map<number, { asset: Asset; timer: ReturnType<typeof setTimeout> }>()
  );
  const rate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;

  const commitDelete = useCallback(async (assetId: number) => {
    pendingRef.current.delete(assetId);
    try {
      await db.deleteAsset(assetId);
    } catch {
      // already gone
    }
    setToast((prev) => (prev?.assetId === assetId ? null : prev));
  }, []);

  const scheduleDelete = useCallback(
    (asset: Asset) => {
      const existing = pendingRef.current.get(asset.id);
      if (existing) clearTimeout(existing.timer);
      setAssets((prev) => (prev ?? []).filter((item) => item.id !== asset.id));
      const timer = setTimeout(() => {
        void commitDelete(asset.id);
      }, UNDO_MS);
      pendingRef.current.set(asset.id, { asset, timer });
      setToast({ assetId: asset.id, name: asset.name });
    },
    [commitDelete]
  );

  const undoDelete = useCallback(() => {
    if (!toast) return;
    const pending = pendingRef.current.get(toast.assetId);
    if (!pending) {
      setToast(null);
      return;
    }
    clearTimeout(pending.timer);
    pendingRef.current.delete(toast.assetId);
    setAssets((prev) =>
      [...(prev ?? []), pending.asset].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id,
      ),
    );
    setToast(null);
  }, [toast]);

  const reload = async () => {
    const next = await db.getAllAssets();
    const pendingIds = new Set(pendingRef.current.keys());
    setAssets(next.filter((asset) => !pendingIds.has(asset.id)));
  };

  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const listRef = useRef<HTMLDivElement>(null);
  const flipTopsRef = useRef<Map<number, number> | null>(null);

  /** Слоты по высоте children — layout, без CSS transform. */
  const getRowSlots = (list: HTMLElement) => {
    const rows = [
      ...list.querySelectorAll<HTMLElement>(':scope > [data-asset-id]'),
    ];
    const gap = 12; // space-y-3
    // list сам не скроллится; top уже с учётом .app-scroll
    let y = list.getBoundingClientRect().top;
    return rows.map((row, index) => {
      if (index > 0) y += gap;
      const top = y;
      const height = row.offsetHeight;
      y += height;
      return {
        row,
        id: Number(row.dataset.assetId),
        top,
        mid: top + height / 2,
      };
    });
  };

  const findTargetId = useCallback((clientY: number, fromId: number) => {
    const list = listRef.current;
    if (!list) return null;
    const slots = getRowSlots(list);
    const fromIndex = slots.findIndex((slot) => slot.id === fromId);
    if (fromIndex < 0) return null;

    // Сосед снизу — опустить
    if (fromIndex < slots.length - 1) {
      const next = slots[fromIndex + 1]!;
      if (clientY > next.mid) return next.id;
    }
    // Сосед сверху — поднять
    if (fromIndex > 0) {
      const prev = slots[fromIndex - 1]!;
      if (clientY < prev.mid) return prev.id;
    }
    return null;
  }, []);

  const moveAsset = useCallback((fromId: number, toId: number) => {
    const root = listRef.current;
    if (root) {
      const tops = new Map<number, number>();
      for (const slot of getRowSlots(root)) {
        if (!Number.isFinite(slot.id)) continue;
        tops.set(slot.id, slot.top);
      }
      flipTopsRef.current = tops;
    }
    setAssets((prev) => {
      if (!prev) return prev;
      const from = prev.findIndex((a) => a.id === fromId);
      const to = prev.findIndex((a) => a.id === toId);
      if (from < 0 || to < 0 || from === to) {
        flipTopsRef.current = null;
        return prev;
      }
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next.map((asset, index) => ({ ...asset, sort_order: index }));
    });
  }, []);

  useLayoutEffect(() => {
    const prevTops = flipTopsRef.current;
    const root = listRef.current;
    if (!prevTops || !root) return;
    flipTopsRef.current = null;

    for (const slot of getRowSlots(root)) {
      const firstTop = prevTops.get(slot.id);
      if (firstTop == null) continue;
      const dy = firstTop - slot.top;
      if (Math.abs(dy) < 0.5) continue;

      const node = slot.row;
      node.style.transition = 'none';
      node.style.transform = `translateY(${dy}px)`;
      void node.offsetHeight;
      node.style.transition =
        'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)';
      node.style.transform = '';

      const clear = (event: TransitionEvent) => {
        if (event.propertyName && event.propertyName !== 'transform') return;
        node.style.transition = '';
        node.style.transform = '';
        node.removeEventListener('transitionend', clear);
      };
      node.addEventListener('transitionend', clear);
    }
  }, [assets]);

  const persistOrder = useCallback(async () => {
    const list = assetsRef.current;
    if (list) await db.reorderAssets(list.map((a) => a.id));
  }, []);

  useEffect(() => {
    void reload();
  }, []);

  if (!assets) return <main className={shell}>Загрузка…</main>;

  const savings = assets.filter((a) => a.provider !== 'credit');
  const credits = assets.filter((a) => a.provider === 'credit');
  const total = savings.reduce(
    (sum, a) => sum + (a.provider === 'usd' ? a.current_amount * rate : a.current_amount),
    0
  );
  const totalDebt = credits.reduce((sum, a) => sum + a.current_amount, 0);

  return (
    <main className={`${shell} relative space-y-4`}>
      <UndoToast
        visible={toast != null}
        message={toast ? `Удалено «${toast.name}»` : ''}
        durationMs={UNDO_MS}
        onUndo={undoDelete}
        onDismiss={() => setToast(null)}
      />

      <FadeIn variant="fade">
        <PageTitle
          title="Ваши активы"
          subtitle="Отслеживайте активы и их доходность"
          align="center"
        />
      </FadeIn>
      <FadeIn index={1} variant="scale">
        <Card className="border-0 bg-[var(--color-navy)] p-5 text-white shadow-lg">
          <p className="text-sm text-slate-300">Всего активов</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {formatRub(total)}
          </p>
          {totalDebt > 0 ? (
            <p className="mt-3 text-sm text-rose-300/80">
              Долги · {formatRub(totalDebt)}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              В рублях по текущему курсу
            </p>
          )}
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900">Ваши активы</h2>
          {assets.length > 1 ? (
            <button
              type="button"
              aria-pressed={reorderMode}
              aria-label={
                reorderMode ? 'Готово — сохранить порядок' : 'Изменить порядок'
              }
              onClick={() => {
                if (reorderMode) void persistOrder();
                setReorderMode((v) => !v);
              }}
              className={
                reorderMode
                  ? 'flex h-9 items-center gap-1.5 rounded-full bg-blue-600 px-3 text-xs font-semibold text-white'
                  : 'flex h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700'
              }
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {reorderMode ? 'Готово' : 'Порядок'}
            </button>
          ) : null}
        </div>
      </FadeIn>
      <div ref={listRef} className="space-y-3">
        {assets.map((a, i) => {
          if (a.provider === 'credit') {
            const repaid = creditRepaidRatio(a);
            const body = reorderMode ? (
              <AssetReorderHandle
                assetId={a.id}
                findTargetId={findTargetId}
                onReorder={moveAsset}
                onReorderEnd={() => void persistOrder()}
              >
                <div className="flex min-w-0 items-center gap-3 py-3.5 pr-3">
                  <AssetAvatar icon={a.icon} bgColor={a.bg_color} iconColor={a.icon_color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-base font-semibold leading-5 text-slate-900">
                        {a.name}
                      </p>
                      <span className="shrink-0 rounded-full bg-[var(--color-expense-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-expense)]">
                        Долг
                      </span>
                    </div>
                    <p className="mt-0.5 text-lg font-bold leading-6 text-slate-900">
                      {formatRub(a.current_amount)}
                    </p>
                  </div>
                </div>
              </AssetReorderHandle>
            ) : (
              <Link
                to="/assets/$slug"
                params={{ slug: assetSlug(a) }}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3.5"
              >
                <AssetAvatar icon={a.icon} bgColor={a.bg_color} iconColor={a.icon_color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-base font-semibold leading-5 text-slate-900">
                      {a.name}
                    </p>
                    <span className="shrink-0 rounded-full bg-[var(--color-expense-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-expense)]">
                      Долг
                    </span>
                  </div>
                  <p className="mt-0.5 text-lg font-bold leading-6 text-slate-900">
                    {formatRub(a.current_amount)}
                  </p>
                  {repaid != null ? (
                    <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-rose-100">
                      <div
                        className="h-full rounded-full bg-rose-400/80"
                        style={{ width: `${repaid * 100}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </Link>
            );

            return (
              <div
                key={a.id}
                data-asset-id={a.id}
              >
                {reorderMode ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                    {body}
                  </div>
                ) : (
                  <FadeIn index={3 + i}>
                    <SwipeToDelete borderRadius={16} onDelete={() => scheduleDelete(a)}>
                      {body}
                    </SwipeToDelete>
                  </FadeIn>
                )}
              </div>
            );
          }

          const hasGoal = a.goal_amount != null && a.goal_amount > 0;
          const valuation = a.provider === 'usd' ? calcUsdValuation(a, rate) : null;
          const usdTrend =
            valuation?.profitPercent != null
              ? `${valuation.profitPercent >= 0 ? '+' : ''}${valuation.profitPercent}%`
              : null;

          const savingsBody = reorderMode ? (
            <AssetReorderHandle
              assetId={a.id}
              findTargetId={findTargetId}
              onReorder={moveAsset}
              onReorderEnd={() => void persistOrder()}
            >
              <div className="flex min-w-0 items-center gap-3 py-3.5 pr-3">
                <AssetAvatar icon={a.icon} bgColor={a.bg_color} iconColor={a.icon_color} />
                <div className="min-w-0 flex-1">
                  <p className="min-w-0 truncate text-base font-semibold leading-5 text-slate-900">
                    {a.name}
                  </p>
                  {a.provider === 'usd' ? (
                    <p className="mt-0.5 text-lg font-bold leading-6 text-slate-900">
                      {formatUsd(a.current_amount)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-lg font-bold leading-6 text-slate-900">
                      {formatRub(a.current_amount)}
                    </p>
                  )}
                </div>
              </div>
            </AssetReorderHandle>
          ) : (
            <Link
              to="/assets/$slug"
              params={{ slug: assetSlug(a) }}
              className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3.5"
            >
              <AssetAvatar icon={a.icon} bgColor={a.bg_color} iconColor={a.icon_color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-base font-semibold leading-5 text-slate-900">
                    {a.name}
                  </p>
                  {hasGoal ? (
                    <GoalProgressBadge
                      current={a.current_amount}
                      goal={a.goal_amount as number}
                    />
                  ) : usdTrend ? (
                    <TrendBadge
                      value={usdTrend}
                      positive={!usdTrend.startsWith('−') && !usdTrend.startsWith('-')}
                    />
                  ) : null}
                </div>
                {a.provider === 'usd' ? (
                  <>
                    <p className="mt-0.5 text-lg font-bold leading-6 text-slate-900">
                      {formatUsd(a.current_amount)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatRub(a.current_amount * rate)}
                    </p>
                  </>
                ) : (
                  <p className="mt-0.5 text-lg font-bold leading-6 text-slate-900">
                    {formatRub(a.current_amount)}
                  </p>
                )}
              </div>
            </Link>
          );

          return (
            <div key={a.id} data-asset-id={a.id}>
              {reorderMode ? (
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  {savingsBody}
                </div>
              ) : (
                <FadeIn index={3 + i}>
                  <SwipeToDelete borderRadius={16} onDelete={() => scheduleDelete(a)}>
                    {savingsBody}
                  </SwipeToDelete>
                </FadeIn>
              )}
            </div>
          );
        })}
      </div>

      <FadeIn index={3 + assets.length}>
        <Link to="/assets/new" className="block text-center">
          <span className="text-[15px] font-semibold text-blue-600">+ Добавить актив</span>
        </Link>
      </FadeIn>
    </main>
  );
}

export function AssetFormScreen({
  asset,
  returnTo,
}: {
  asset?: Asset;
  returnTo?: string;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(asset?.name ?? '');
  const [purpose, setPurpose] = useState(asset?.purpose ?? '');
  const [provider, setProvider] = useState(asset?.provider ?? 'rub');
  const [goal, setGoal] = useState(asset?.goal_amount ? String(asset.goal_amount) : '');
  const [amount, setAmount] = useState(asset ? String(asset.current_amount) : '');
  const [rate, setRate] = useState('82');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [paymentDay, setPaymentDay] = useState('10');
  const [linkExpense, setLinkExpense] = useState(true);
  const [creditRate, setCreditRate] = useState('');
  const [creditTermMonths, setCreditTermMonths] = useState('');
  const [creditStartDate, setCreditStartDate] = useState('');
  const [earlyRepayMode, setEarlyRepayMode] = useState<
    'reduce_term' | 'reduce_payment'
  >('reduce_term');
  const isCredit = provider === 'credit';
  const [style, setStyle] = useState({
    icon: (asset?.icon as AssetIconName) || (isCredit ? CREDIT_DEFAULTS.icon : defaults.icon),
    bgColor: asset?.bg_color ?? (isCredit ? CREDIT_DEFAULTS.bgColor : defaults.bgColor),
    iconColor: asset?.icon_color ?? (isCredit ? CREDIT_DEFAULTS.iconColor : defaults.iconColor)
  });

  const annualRate = creditRate.trim() ? numeric(creditRate) : 0;
  const termMonths = creditTermMonths.trim()
    ? Math.max(1, Math.round(numeric(creditTermMonths)))
    : 0;
  const hasInterest = annualRate > 0;
  const initialDebt =
    numeric(goal || '0') || numeric(amount || '0');
  const paymentDayNum = Math.min(31, Math.max(1, Number(paymentDay) || 10));
  const isExistingLoan = isExistingCreditLoan(creditStartDate || null);
  const suggestedPayment = useMemo(() => {
    if (!isCredit || !hasInterest || termMonths <= 0 || initialDebt <= 0) {
      return null;
    }
    return contractualAnnuityPayment({
      initialDebt,
      annualPercent: annualRate,
      termMonths,
    });
  }, [isCredit, hasInterest, termMonths, initialDebt, annualRate]);
  const remainingFromSchedule = useMemo(() => {
    if (!creditStartDate || termMonths <= 0) return null;
    return creditRemainingMonthsFromSchedule({
      startDate: creditStartDate,
      termMonths,
      paymentDay: paymentDayNum,
    });
  }, [creditStartDate, termMonths, paymentDayNum]);

  useEffect(() => {
    if (!suggestedPayment || paymentTouched || isExistingLoan) return;
    setPaymentAmount(String(suggestedPayment));
  }, [suggestedPayment, paymentTouched, isExistingLoan]);

  const onProviderChange = (next: Asset['provider']) => {
    setProvider(next);
    if (!asset && next === 'credit') {
      setStyle({
        icon: CREDIT_DEFAULTS.icon,
        bgColor: CREDIT_DEFAULTS.bgColor,
        iconColor: CREDIT_DEFAULTS.iconColor,
      });
    }
  };

  const save = async () => {
    if (!name.trim()) return;
    if (asset) {
      await db.updateAsset(asset.id, {
        name,
        purpose: purpose || null,
        goal_amount: goal ? numeric(goal) : null,
        icon: style.icon,
        bg_color: style.bgColor,
        icon_color: style.iconColor
      });
      const updated = { ...asset, name };
      await navigate({
        to: '/assets/$slug',
        params: { slug: assetSlug(updated) }
      });
      return;
    }
    const remaining = numeric(amount || '0');
    const initial = goal ? numeric(goal) : remaining;
    const id = await db.createAsset({
      name,
      purpose,
      provider,
      goal_amount: isCredit ? (initial || remaining) : goal ? numeric(goal) : undefined,
      current_amount: remaining,
      cost_basis_rub: provider === 'usd' ? remaining * numeric(rate) : undefined,
      icon: style.icon,
      bg_color: style.bgColor,
      icon_color: style.iconColor,
      credit_annual_rate: isCredit && hasInterest ? annualRate : null,
      credit_term_months: isCredit && hasInterest && termMonths > 0 ? termMonths : null,
      credit_start_date:
        isCredit && hasInterest && creditStartDate.trim()
          ? creditStartDate.trim()
          : null,
      credit_remaining_months:
        isCredit && hasInterest && termMonths > 0
          ? (remainingFromSchedule ?? termMonths)
          : null,
      credit_early_repay_mode:
        isCredit && hasInterest ? earlyRepayMode : null,
      credit_payment:
        isCredit && linkExpense && numeric(paymentAmount) > 0
          ? {
              amount: numeric(paymentAmount),
              due_day: paymentDayNum,
            }
          : undefined,
    });
    if (returnTo) {
      await navigate({ to: returnTo, replace: true });
      return;
    }
    await navigate({
      to: '/assets/$slug',
      params: { slug: assetSlug({ id, name }) },
      replace: true,
    });
  };

  return (
    <PageTransition fill>
      <main className={formShell}>
        <PageHeader
          title={asset ? 'Редактировать' : 'Новый актив'}
          backTo={returnTo ?? '/assets'}
        />

        <div className={formScroll}>
          <div>
            <Label required>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCredit ? 'Например, Ипотека' : 'Например, Подушка безопасности'}
            />
          </div>
          <div>
            <Label>Описание</Label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Необязательно"
            />
          </div>

          {!asset ? (
            <>
              <div>
                <Label required>Тип</Label>
                <Select value={provider} onValueChange={(v) => onProviderChange(v as Asset['provider'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getEnabledProviders().map((p) => (
                      <SelectItem key={p} value={p}>
                        {ASSET_PROVIDERS[p].symbol} {ASSET_PROVIDERS[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {isCredit
                    ? 'Остаток долга, ₽'
                    : `Текущая сумма${provider === 'rub' ? ', ₽' : ', $'}`}
                </Label>
                <Input
                  type="number"
                  format="money"
                  suffix={provider === 'usd' ? '$' : '₽'}
                  withRelativeSuffix
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              {provider === 'usd' ? (
                <div>
                  <Label>Курс покупки, ₽</Label>
                  <Input
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              ) : null}
              {isCredit ? (
                <>
                  <div>
                    <Label required>Исходный долг, ₽</Label>
                    <Input
                      type="number"
                      format="money"
                      suffix="₽"
                      withRelativeSuffix
                      hideSuffixWhenEmpty
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Как остаток, если пусто"
                      className="[&_input]:placeholder:font-normal"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Нужен для прогресса погашения
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label required>Ставка, % годовых</Label>
                      <Input
                        type="number"
                        format="money"
                        suffix="%"
                        withRelativeSuffix
                        value={creditRate}
                        onChange={(e) => setCreditRate(e.target.value)}
                        placeholder="пусто = долг"
                        className="[&_input]:placeholder:font-normal"
                      />
                    </div>
                    <div>
                      <Label required>Срок, мес</Label>
                      <Input
                        type="number"
                        format="money"
                        suffix="мес."
                        withRelativeSuffix
                        value={creditTermMonths}
                        onChange={(e) => setCreditTermMonths(e.target.value)}
                        placeholder="60"
                        disabled={!hasInterest}
                        className="[&_input]:placeholder:font-normal"
                      />
                    </div>
                  </div>
                  {hasInterest ? (
                    <div className="min-w-0">
                      <Label>Дата выдачи</Label>
                      <DatePicker
                        placeholder="дд.мм.гггг"
                        value={creditStartDate}
                        onChange={(e) => setCreditStartDate(e.target.value)}
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        {isExistingLoan
                          ? 'Кредит уже платится — укажите текущий платёж из банка'
                          : 'Для нового кредита можно оставить сегодня'}
                      </p>
                    </div>
                  ) : null}
                  {hasInterest ? (
                    <p className="text-xs text-slate-400">
                      {suggestedPayment != null
                        ? isExistingLoan
                          ? `При выдаче платёж был бы ≈ ${suggestedPayment.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
                          : `Аннуитет при выдаче ≈ ${suggestedPayment.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
                        : 'Укажите исходный долг и срок'}
                      {remainingFromSchedule != null
                        ? ` · осталось ≈ ${remainingFromSchedule} мес.`
                        : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Без ставки — простой долг: остаток делится на платёж
                    </p>
                  )}
                  <div className="rounded-2xl border border-slate-100 bg-white p-3.5">
                    <button
                      type="button"
                      onClick={() => setLinkExpense((v) => !v)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span
                        className={
                          linkExpense
                            ? 'flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-600'
                            : 'flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300'
                        }
                      >
                        {linkExpense ? (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        ) : null}
                      </span>
                      <span>
                        <p className="text-sm font-semibold text-slate-900">
                          Создать обязательный платёж
                        </p>
                        <p className="text-xs text-slate-400">
                          Появится в расходах и в отчёте цикла
                        </p>
                      </span>
                    </button>
                    {linkExpense ? (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Платёж / мес
                          </Label>
                          <Input
                            value={paymentAmount}
                            onChange={(e) => {
                              setPaymentTouched(true);
                              setPaymentAmount(e.target.value);
                            }}
                            inputMode="decimal"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            День
                          </Label>
                          <Input
                            value={paymentDay}
                            onChange={(e) => setPaymentDay(e.target.value)}
                            inputMode="numeric"
                            placeholder="10"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          {!isCredit || asset ? (
            <div>
              <Label>
                {isCredit
                  ? 'Исходный долг, ₽'
                  : `Цель накопления${provider === 'usd' ? ', $' : ', ₽'}`}
              </Label>
              <Input
                type="number"
                format="money"
                suffix={provider === 'usd' ? '$' : '₽'}
                withRelativeSuffix
                hideSuffixWhenEmpty
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Необязательно"
                className="[&_input]:placeholder:font-normal"
              />
            </div>
          ) : null}

          <AssetStylePicker
            icon={style.icon}
            bgColor={style.bgColor}
            iconColor={style.iconColor}
            onIconChange={(icon) => setStyle((x) => ({ ...x, icon }))}
            onBgChange={(bgColor) => setStyle((x) => ({ ...x, bgColor }))}
            onIconColorChange={(iconColor) => setStyle((x) => ({ ...x, iconColor }))}
          />
        </div>

        <div className="shrink-0 space-y-2 border-t border-slate-100 bg-[#f8fafc] px-0 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <Button className="w-full" size="lg" onClick={() => void save()}>
            {asset ? 'Сохранить' : 'Создать'}
          </Button>
          <button
            type="button"
            className="w-full py-2 text-center text-sm text-slate-400"
            onClick={() => void navigate({ to: '/assets' })}
          >
            Отмена
          </button>
        </div>
      </main>
    </PageTransition>
  );
}

export function AssetDetailScreen({ slug }: { slug: string }) {
  const [probe, setProbe] = useState<{
    state: 'loading' | 'credit' | 'asset' | 'missing';
  }>({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void db.getAssetBySlug(slug).then((asset) => {
      if (cancelled) return;
      if (!asset) setProbe({ state: 'missing' });
      else if (asset.provider === 'credit') setProbe({ state: 'credit' });
      else setProbe({ state: 'asset' });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (probe.state === 'loading') {
    return (
      <PageTransition>
        <main className={nestedShell}>Загрузка…</main>
      </PageTransition>
    );
  }
  if (probe.state === 'missing') {
    return (
      <PageTransition>
        <ErrorPage
          status={404}
          title="Актив не найден"
          message="Этот актив удалён или ссылка устарела. Вернитесь к списку активов и выберите другой."
          homeTo="/assets"
          homeLabel="К активам"
        />
      </PageTransition>
    );
  }
  if (probe.state === 'credit') {
    return <CreditDetailScreen slug={slug} />;
  }

  return <AssetDetailBody slug={slug} />;
}

function AssetDetailBody({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof db.getTransactions>>>(
    []
  );
  const [transferTargets, setTransferTargets] = useState<Asset[]>([]);
  const [amount, setAmount] = useState('');
  const [buyRate, setBuyRate] = useState('82');
  const [sellRate, setSellRate] = useState('82');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);
  const [fundSource, setFundSource] = useState<'manual' | 'free_money'>('manual');
  const [freeMoney, setFreeMoney] = useState<{
    amountRub: number;
    expenseStart: Date;
    expenseEndExclusive: Date;
  } | null>(null);
  const [ruleSuggestOpen, setRuleSuggestOpen] = useState(false);
  const [ruleSuggestSnoozeChecked, setRuleSuggestSnoozeChecked] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editStyle, setEditStyle] = useState({
    icon: defaults.icon as AssetIconName,
    bgColor: defaults.bgColor,
    iconColor: defaults.iconColor
  });
  const usdRate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;

  const reload = useCallback(async () => {
    const next = await db.getAssetBySlug(slug);
    if (!next) {
      setAsset(null);
      setTransactions([]);
      setTransferTargets([]);
      setLoadState('missing');
      return;
    }
    setAsset(next);
    setTransactions(await db.getTransactions(next.id));
    const all = await db.getAllAssets();
    setTransferTargets(
      all.filter((a) => a.id !== next.id && a.provider === 'rub'),
    );
    setLoadState('ready');
  }, [slug]);

  useEffect(() => {
    setLoadState('loading');
    void reload();
  }, [reload]);

  const loadFreeMoney = useCallback(async () => {
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
    const cycle = cycles.find((c) => !c.isPreview) ?? cycles[0] ?? null;
    if (!cycle) {
      setFreeMoney(null);
      return;
    }
    const trackingStartedAt = db.ensureTrackingStartedAt(cycle.nominalDate);
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
      usdRubRate: usdRate,
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
      usdRubRate: usdRate,
      carryInRub: carryIn.amountRub,
    });
    if (isReportError(report)) {
      setFreeMoney(null);
      return;
    }
    const rejectedIds = await db.getRejectedRuleIds(report.cycleKey);
    const effectiveAllocatedRub = report.allocations
      .filter((item) => !rejectedIds.includes(item.ruleId))
      .reduce((sum, item) => sum + item.amountRub, 0);
    setFreeMoney({
      amountRub: report.remainder - effectiveAllocatedRub,
      expenseStart: cycle.expenseStart,
      expenseEndExclusive: cycle.expenseEndExclusive,
    });
  }, [usdRate]);

  useEffect(() => {
    void loadFreeMoney();
  }, [loadFreeMoney]);

  useEffect(() => {
    if (!asset || !editOpen) return;
    setEditName(asset.name);
    setEditPurpose(asset.purpose ?? '');
    setEditGoal(asset.goal_amount ? String(asset.goal_amount) : '');
    setEditStyle({
      icon: (asset.icon as AssetIconName) || defaults.icon,
      bgColor: asset.bg_color,
      iconColor: asset.icon_color
    });
  }, [asset, editOpen]);

  useEffect(() => {
    if (mode !== 'withdraw' || !asset || asset.provider !== 'usd') return;
    setSellRate(String(usdRate));
    setTransferTargetId('');
  }, [mode, asset, usdRate]);

  if (loadState === 'loading') {
    return (
      <PageTransition>
        <main className={nestedShell}>Загрузка…</main>
      </PageTransition>
    );
  }

  if (loadState === 'missing' || !asset) {
    return (
      <PageTransition>
        <ErrorPage
          status={404}
          title="Актив не найден"
          message="Этот актив удалён или ссылка устарела. Вернитесь к списку активов и выберите другой."
          homeTo="/assets"
          homeLabel="К активам"
        />
      </PageTransition>
    );
  }

  const closeMoneySheet = () => {
    setMode(null);
    setAmount('');
    setTransferTargetId('');
    setFundSource('manual');
  };

  const depositRubValue = numeric(amount) * (asset.provider === 'usd' ? numeric(buyRate) : 1);

  const change = async () => {
    const value = numeric(amount);
    if (!value || !mode) return;

    if (mode === 'deposit') {
      if (fundSource === 'free_money') {
        if (!freeMoney || depositRubValue > freeMoney.amountRub) return;
        const today = startOfDay(new Date());
        const start = startOfDay(freeMoney.expenseStart);
        const lastValidDay = startOfDay(freeMoney.expenseEndExclusive);
        lastValidDay.setDate(lastValidDay.getDate() - 1);
        const specificDate = today < start ? start : today > lastValidDay ? lastValidDay : today;
        const entries = expensesToEntries(await db.getAllExpenses());
        entries.push({
          ...createEmptyExpenseEntry(),
          name: `Пополнение «${asset.name}»`,
          amount: String(depositRubValue),
          currency: 'rub',
          isOneTime: true,
          specificDate: toIsoDate(specificDate),
        });
        await db.replaceAllExpenses(entries);
      }

      await db.addTransaction(
        asset.id,
        value,
        fundSource === 'free_money' ? 'Пополнение из свободных денег' : 'Пополнение',
        asset.provider === 'usd' ? value * numeric(buyRate) : undefined,
      );

      if (fundSource === 'free_money') {
        const count = await db.recordFreeMoneyTopup(asset.id);
        const rules = await db.getAllRules();
        const hasRule = rules.some((r) => r.target_asset_id === asset.id);
        if (count >= 2 && !hasRule && !db.isRuleSuggestionSnoozedSync(asset.id)) {
          setRuleSuggestSnoozeChecked(false);
          setRuleSuggestOpen(true);
        }
        void loadFreeMoney();
      }

      closeMoneySheet();
      await reload();
      return;
    }

    if (asset.provider === 'usd') {
      const rate = numeric(sellRate);
      if (!rate || !transferTargetId) return;
      if (value > asset.current_amount) return;
      const target = transferTargets.find((a) => String(a.id) === transferTargetId);
      if (!target) return;
      const rubReceived = value * rate;
      await db.addTransaction(
        asset.id,
        -value,
        `Продажа → ${target.name} · курс ${rate}`,
      );
      await db.addTransaction(
        target.id,
        rubReceived,
        `Из «${asset.name}» · ${formatUsd(value)} × ${rate}`,
        rubReceived,
      );
      closeMoneySheet();
      await reload();
      return;
    }

    await db.addTransaction(asset.id, -value, 'Списание');
    closeMoneySheet();
    await reload();
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    await db.updateAsset(asset.id, {
      name: editName,
      purpose: editPurpose || null,
      goal_amount: editGoal ? numeric(editGoal) : null,
      icon: editStyle.icon,
      bg_color: editStyle.bgColor,
      icon_color: editStyle.iconColor
    });
    setEditOpen(false);
    const nextSlug = assetSlug({ id: asset.id, name: editName });
    if (nextSlug !== slug) {
      await navigate({ to: '/assets/$slug', params: { slug: nextSlug }, replace: true });
    } else {
      await reload();
    }
  };

  const valuation = asset.provider === 'usd' ? calcUsdValuation(asset, usdRate) : null;
  const progress =
    asset.goal_amount && asset.goal_amount > 0
      ? Math.min(100, (asset.current_amount / asset.goal_amount) * 100)
      : null;

  return (
    <PageTransition>
      <main className={`${nestedShell} space-y-4`}>
        <PageHeader
          title="Актив"
          backTo="/assets"
          right={
            <button type="button" onClick={() => setEditOpen(true)} aria-label="Редактировать">
              <Pencil className="h-5 w-5 text-blue-600" />
            </button>
          }
        />

        <div className="flex flex-col gap-1.5">
          <FadeIn variant="fade" className="flex flex-col items-center gap-2 pt-1">
            <AssetAvatar
              icon={asset.icon}
              bgColor={asset.bg_color}
              iconColor={asset.icon_color}
              size="lg"
            />
            <div className="px-2 text-center">
              <h1 className="text-2xl font-bold leading-tight text-slate-900">{asset.name}</h1>
              {asset.purpose?.trim() ? (
                <FadeIn index={1} variant="up" className="mt-1">
                  <p className="text-sm leading-snug text-slate-400">{asset.purpose.trim()}</p>
                </FadeIn>
              ) : null}
            </div>
          </FadeIn>

          <FadeIn index={2}>
            <Card
              className={
                progress != null
                  ? 'border-slate-100 p-5 text-center shadow-sm'
                  : 'border-0 bg-slate-50 px-5 py-0 text-center shadow-none'
              }
            >
              <p className="text-3xl font-bold leading-none text-slate-900">
                {asset.provider === 'usd'
                  ? formatUsd(asset.current_amount)
                  : formatRub(asset.current_amount)}
              </p>
              {asset.provider === 'usd' ? (
                <p className="mt-1.5 text-slate-400 leading-none">
                  {formatRub(asset.current_amount * usdRate)}
                </p>
              ) : null}
              {valuation?.profitPercent != null ? (
                <div className="mt-2 flex justify-center">
                  <TrendBadge
                    value={`${valuation.profitPercent >= 0 ? '+' : ''}${valuation.profitPercent}%`}
                    positive={valuation.profitPercent >= 0}
                  />
                </div>
              ) : null}
              {progress != null && asset.goal_amount ? (
                <div className="mt-5 text-left">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-500">Прогресс цели</span>
                    <span className="font-semibold text-slate-800">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2.5 text-center text-xs text-slate-400">
                    Накоплено{' '}
                    {asset.provider === 'usd'
                      ? formatUsd(asset.current_amount)
                      : formatRub(asset.current_amount)}{' '}
                    из{' '}
                    {asset.provider === 'usd'
                      ? formatUsd(asset.goal_amount)
                      : formatRub(asset.goal_amount)}
                  </p>
                </div>
              ) : null}
            </Card>
          </FadeIn>
        </div>

        {valuation ? (
          <Card className="space-y-3 border-slate-100 p-4 shadow-sm">
            <p className="font-semibold">Валютная аналитика</p>
            {(
              [
                [
                  'Средний курс покупки',
                  valuation.averageBuyRate
                    ? `${valuation.averageBuyRate.toFixed(2)} ₽/$`
                    : '—'
                ],
                ['Текущий курс', <ExchangeRateBadge compact variant="inline" />],
                ['Потрачено', formatRub(valuation.costBasisRub)],
                ['Сейчас стоит', formatRub(valuation.currentValueRub)],
                [
                  'Прибыль',
                  `${valuation.profitRub >= 0 ? '+' : ''}${formatRub(valuation.profitRub)}`
                ]
              ] as Array<[string, ReactNode]>
            ).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 text-sm">
                <span className="shrink-0 text-slate-400">{label}</span>
                <span
                  className={
                    label === 'Прибыль'
                      ? valuation.profitRub >= 0
                        ? 'min-w-0 text-right font-semibold tabular-nums text-emerald-600'
                        : 'min-w-0 text-right font-semibold tabular-nums text-rose-600'
                      : 'min-w-0 text-right font-medium tabular-nums text-slate-900'
                  }
                >
                  {value}
                </span>
              </div>
            ))}
          </Card>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" onClick={() => setMode('deposit')}>
            Пополнить
          </Button>
          <Button size="lg" variant="destructive" onClick={() => setMode('withdraw')}>
            Списать
          </Button>
        </div>

        <section>
          <h2 className="mb-3 font-bold text-slate-900">История операций</h2>
          {transactions.length ? (
            <ul className="space-y-2">
              {transactions.map((tx) => {
                const positive = tx.amount_delta >= 0;
                const title = positive ? 'Пополнение' : 'Списание';
                const amountText = `${positive ? '+' : ''}${
                  asset.provider === 'usd'
                    ? formatUsd(tx.amount_delta)
                    : formatRub(tx.amount_delta)
                }`;
                const when = new Date(tx.created_at).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const note = tx.note && tx.note !== title ? tx.note : null;
                return (
                  <li
                    key={tx.id}
                    className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-slate-100"
                  >
                    <div
                      className={
                        positive
                          ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600'
                          : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600'
                      }
                      aria-hidden
                    >
                      {positive ? (
                        <ArrowDownLeft className="h-5 w-5" strokeWidth={2} />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {when}
                        {note ? ` · ${note}` : ''}
                      </p>
                    </div>
                    <p
                      className={
                        positive
                          ? 'shrink-0 self-center whitespace-nowrap text-right text-[15px] font-bold tabular-nums tracking-tight text-emerald-600'
                          : 'shrink-0 self-center whitespace-nowrap text-right text-[15px] font-bold tabular-nums tracking-tight text-rose-600'
                      }
                    >
                      {amountText}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <p className="font-bold text-slate-900">Пока пусто</p>
              <p className="mx-auto mt-1.5 max-w-[260px] text-sm leading-snug text-slate-400">
                Пополните или спишите сумму — здесь появится история движений по активу
              </p>
              <Button className="mt-5" onClick={() => setMode('deposit')}>
                Пополнить актив
              </Button>
            </div>
          )}
        </section>

        <Sheet
          open={mode != null}
          onOpenChange={(o) => {
            if (!o) closeMoneySheet();
          }}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{mode === 'deposit' ? 'Пополнить' : 'Списать'}</SheetTitle>
            </SheetHeader>
            <SheetBody className="space-y-3">
              <div>
                <Label required>Сумма</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder={asset.provider === 'usd' ? 'Сумма в $' : 'Сумма в ₽'}
                />
              </div>
              {asset.provider === 'usd' && mode === 'deposit' ? (
                <div>
                  <Label>Курс покупки, ₽</Label>
                  <Input
                    value={buyRate}
                    onChange={(e) => setBuyRate(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              ) : null}
              {mode === 'deposit' && freeMoney ? (
                <div>
                  <Label>Источник</Label>
                  <div className="mt-2">
                    <SlidingToggleGroup
                      size="sm"
                      value={fundSource}
                      onValueChange={(key) =>
                        setFundSource(key as 'manual' | 'free_money')
                      }
                      options={[
                        { value: 'manual', label: 'Вручную' },
                        { value: 'free_money', label: 'Из свободных денег' },
                      ]}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {fundSource === 'free_money'
                      ? depositRubValue > freeMoney.amountRub
                        ? `Доступно только ${formatRub(freeMoney.amountRub)}`
                        : `Доступно: ${formatRub(freeMoney.amountRub)}`
                      : 'Деньги со стороны, не из текущего цикла'}
                  </p>
                </div>
              ) : null}
              {asset.provider === 'usd' && mode === 'withdraw' ? (
                <>
                  <div>
                    <Label required>Курс продажи, ₽</Label>
                    <Input
                      value={sellRate}
                      onChange={(e) => setSellRate(e.target.value)}
                      inputMode="decimal"
                      placeholder="По какому курсу продали"
                    />
                    {numeric(amount) > 0 && numeric(sellRate) > 0 ? (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Получите {formatRub(numeric(amount) * numeric(sellRate))}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label required>Куда положить рубли</Label>
                    {transferTargets.length ? (
                      <div className="mt-2 space-y-2">
                        {transferTargets.map((target) => (
                          <button
                            key={target.id}
                            type="button"
                            onClick={() => setTransferTargetId(String(target.id))}
                            className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left ${
                              transferTargetId === String(target.id)
                                ? 'border-blue-500 ring-1 ring-blue-500'
                                : 'border-slate-100'
                            }`}
                          >
                            <AssetAvatar
                              icon={target.icon}
                              bgColor={target.bg_color}
                              iconColor={target.icon_color}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900">
                                {target.name}
                              </p>
                              <p className="text-sm text-slate-400">
                                {formatRub(target.current_amount)}
                              </p>
                            </div>
                            <span
                              className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                                transferTargetId === String(target.id)
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Нет рублёвого актива. Создайте, например, «Подушку», чтобы
                        положить туда выручку.
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </SheetBody>
            <SheetFooter>
              <Button
                className="w-full"
                size="lg"
                disabled={
                  !numeric(amount) ||
                  (asset.provider === 'usd' &&
                    mode === 'withdraw' &&
                    (!numeric(sellRate) ||
                      !transferTargetId ||
                      numeric(amount) > asset.current_amount)) ||
                  (mode === 'deposit' &&
                    fundSource === 'free_money' &&
                    (!freeMoney || depositRubValue > freeMoney.amountRub))
                }
                onClick={() => void change()}
              >
                Подтвердить
              </Button>
              <button
                type="button"
                className="w-full py-2 text-sm text-slate-400"
                onClick={closeMoneySheet}
              >
                Отмена
              </button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet
          open={ruleSuggestOpen}
          onOpenChange={(o) => {
            if (!o) {
              if (ruleSuggestSnoozeChecked) void db.snoozeRuleSuggestion(asset.id);
              setRuleSuggestOpen(false);
            }
          }}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Автоматизировать пополнение?</SheetTitle>
            </SheetHeader>
            <SheetBody className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <GitBranch className="h-5 w-5" />
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  Вы дважды пополнили «{asset.name}» из свободных денег вручную.
                  Создайте правило — и часть остатка будет уходить сюда
                  автоматически каждый цикл.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRuleSuggestSnoozeChecked((v) => !v)}
                className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3.5 text-left"
              >
                <span
                  className={
                    ruleSuggestSnoozeChecked
                      ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-blue-600 bg-blue-600'
                      : 'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-300'
                  }
                >
                  {ruleSuggestSnoozeChecked ? (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  ) : null}
                </span>
                <span className="text-sm text-slate-600">
                  Не предлагать для этого актива в течение месяца
                </span>
              </button>
            </SheetBody>
            <SheetFooter className="gap-2 sm:flex-col">
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setRuleSuggestOpen(false);
                  void navigate({
                    to: '/settings/rules/new',
                    search: { asset: String(asset.id) },
                  });
                }}
              >
                Создать правило
              </Button>
              <button
                type="button"
                className="w-full py-2 text-sm text-slate-400"
                onClick={() => {
                  if (ruleSuggestSnoozeChecked) void db.snoozeRuleSuggestion(asset.id);
                  setRuleSuggestOpen(false);
                }}
              >
                Не сейчас
              </button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Редактировать</SheetTitle>
            </SheetHeader>
            <SheetBody className="space-y-4">
              <div>
                <Label required>Название</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <Label>Описание</Label>
                <Input
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  placeholder="Необязательно"
                />
              </div>
              <div>
                <Label>
                  Цель накопления
                  {asset.provider === 'usd' ? ', $' : ', ₽'}
                </Label>
                <Input
                  type="number"
                  format="money"
                  suffix={asset.provider === 'usd' ? '$' : '₽'}
                  withRelativeSuffix
                  hideSuffixWhenEmpty
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  placeholder="Необязательно"
                  className="[&_input]:placeholder:font-normal"
                />
              </div>
              <AssetStylePicker
                icon={editStyle.icon}
                bgColor={editStyle.bgColor}
                iconColor={editStyle.iconColor}
                onIconChange={(icon) => setEditStyle((x) => ({ ...x, icon }))}
                onBgChange={(bgColor) => setEditStyle((x) => ({ ...x, bgColor }))}
                onIconColorChange={(iconColor) => setEditStyle((x) => ({ ...x, iconColor }))}
              />
            </SheetBody>
            <SheetFooter>
              <Button className="w-full" size="lg" onClick={() => void saveEdit()}>
                Сохранить
              </Button>
              <button
                type="button"
                className="w-full py-2 text-sm text-slate-400"
                onClick={() => setEditOpen(false)}
              >
                Отмена
              </button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </main>
    </PageTransition>
  );
}

export function SettingsScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDraft, setImportDraft] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const rate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;

  useEffect(() => {
    void Promise.all([
      db.getAllIncomes(),
      db.getAllExpenses(),
      db.getAllRules(),
      db.getAllAssets(),
      db.getAllVacations(),
    ]).then(([incomes, expenses, rules, assets, vacations]) => {
      const points = computeCycleHistory({
        incomes,
        expenses,
        rules,
        assets,
        vacations,
        today: new Date(),
        usdRubRate: rate,
        monthsBack: 6,
        trackingStartedAt: db.getTrackingStartedAtSync(),
      });
      setHasHistory(points.length > 0);
    });
  }, [rate]);

  const clear = async () => {
    await db.clearAllData();
    await navigate({ to: '/onboarding' });
  };

  const exportData = async () => {
    const json = await db.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `monesto-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const pickImportFile = () => {
    setImportError('');
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !Array.isArray(parsed.assets) ||
        !Array.isArray(parsed.income_sources)
      ) {
        throw new Error();
      }
    } catch {
      setImportError('Это не похоже на резервную копию Monesto');
      return;
    }
    setImportError('');
    setImportDraft(text);
    setImportOpen(true);
  };

  const confirmImport = async () => {
    if (!importDraft) return;
    setImporting(true);
    try {
      await db.importBackup(importDraft);
      window.location.href = '/';
    } catch {
      setImportError('Не удалось импортировать файл');
      setImportOpen(false);
      setImporting(false);
    }
  };

  const entries = [
    {
      to: '/settings/rules' as const,
      label: 'Авто-распределение',
      desc: 'Правила покупки активов',
      icon: GitBranch,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      to: '/settings/income' as const,
      label: 'Доходы',
      desc: 'Зарплата и поступления',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-700'
    },
    {
      to: '/settings/expenses' as const,
      label: 'Расходы',
      desc: 'Обязательные платежи',
      icon: Wallet,
      color: 'bg-slate-100 text-slate-600'
    },
    {
      to: '/settings/vacation' as const,
      label: 'Отпуск',
      desc: 'Периоды и влияние на выплаты',
      icon: CalendarDays,
      color: 'bg-amber-50 text-amber-700'
    },
    ...(hasHistory
      ? [
          {
            to: '/history' as const,
            label: 'История циклов',
            desc: 'Доходы и расходы за полгода',
            icon: History,
            color: 'bg-indigo-50 text-indigo-600'
          }
        ]
      : [])
  ];

  return (
    <main className={`${shell} space-y-4`}>
      <FadeIn variant="fade">
        <PageTitle title="Настройки" subtitle="Доходы, расходы, отпуск и правила распределения" />
      </FadeIn>

      <FadeIn index={1}>
        <Card className="overflow-hidden border-slate-100 p-0 shadow-sm">
          {entries.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to}>
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <Card className="overflow-hidden border-slate-100 p-0 shadow-sm">
          <button
            type="button"
            onClick={() => void exportData()}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Экспорт данных</p>
              <p className="text-sm text-slate-400">Скачать резервную копию в файл</p>
            </div>
          </button>
          <button
            type="button"
            onClick={pickImportFile}
            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3.5 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Upload className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Импорт данных</p>
              <p className="text-sm text-slate-400">Восстановить из файла резервной копии</p>
            </div>
          </button>
        </Card>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => void onFileSelected(e)}
        />
        {importError ? (
          <p className="mt-1.5 px-1 text-sm text-red-600">{importError}</p>
        ) : null}
      </FadeIn>

      <FadeIn index={3}>
        <DangerClearButton onConfirm={clear} />
      </FadeIn>

      <FadeIn index={4} variant="fade">
        <AppAboutFooter />
      </FadeIn>

      <Sheet open={importOpen} onOpenChange={(o) => { if (!importing) setImportOpen(o); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Импортировать данные?</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            <p className="text-sm leading-relaxed text-slate-500">
              Текущие доходы, расходы, активы и правила будут полностью заменены
              содержимым файла. Если хотите сохранить нынешние данные — сначала
              сделайте экспорт.
            </p>
          </SheetBody>
          <SheetFooter className="gap-2 sm:flex-col">
            <Button
              variant="destructive"
              className="w-full"
              size="lg"
              disabled={importing}
              onClick={() => void confirmImport()}
            >
              Импортировать и заменить
            </Button>
            <button
              type="button"
              className="w-full py-2 text-sm text-slate-400"
              onClick={() => setImportOpen(false)}
              disabled={importing}
            >
              Отмена
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}

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

export function RulesScreen() {
  const [data, setData] = useState<{
    rules: DistributionRule[];
    assets: Asset[];
    remainder: number;
  } | null>(null);
  const [toast, setToast] = useState<{ ruleId: number; name: string } | null>(null);
  const pendingRef = useRef(
    new Map<number, { rule: DistributionRule; timer: ReturnType<typeof setTimeout> }>()
  );
  const rate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;

  const load = useCallback(async () => {
    const [rules, assets, incomes, expenses] = await Promise.all([
      db.getAllRules(),
      db.getAllAssets(),
      db.getAllIncomes(),
      db.getAllExpenses()
    ]);
    const report = calculateReport({
      incomes,
      expenses,
      rules,
      assets,
      today: new Date(),
      usdRubRate: rate
    });
    const remainder = isReportError(report) ? 100_000 : report.remainder;
    const pendingIds = new Set(pendingRef.current.keys());
    setData({
      rules: rules.filter((rule) => !pendingIds.has(rule.id)),
      assets,
      remainder
    });
  }, [rate]);

  useEffect(() => {
    void load();
  }, [load]);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    if (pathname === '/settings/rules' || pathname === '/settings/rules/') {
      void load();
    }
  }, [pathname, load]);

  const commitDelete = useCallback(async (ruleId: number) => {
    pendingRef.current.delete(ruleId);
    try {
      await db.deleteRule(ruleId);
    } catch {
      // already gone
    }
    setToast((prev) => (prev?.ruleId === ruleId ? null : prev));
  }, []);

  const scheduleDelete = useCallback(
    (rule: DistributionRule) => {
      const existing = pendingRef.current.get(rule.id);
      if (existing) clearTimeout(existing.timer);
      setData((prev) =>
        prev ? { ...prev, rules: prev.rules.filter((item) => item.id !== rule.id) } : prev
      );
      const timer = setTimeout(() => {
        void commitDelete(rule.id);
      }, UNDO_MS);
      pendingRef.current.set(rule.id, { rule, timer });
      setToast({ ruleId: rule.id, name: rule.name });
    },
    [commitDelete]
  );

  const undoDelete = useCallback(() => {
    if (!toast) return;
    const pending = pendingRef.current.get(toast.ruleId);
    if (!pending) {
      setToast(null);
      return;
    }
    clearTimeout(pending.timer);
    pendingRef.current.delete(toast.ruleId);
    setData((prev) =>
      prev
        ? {
            ...prev,
            rules: [...prev.rules, pending.rule].sort((a, b) => a.sort_order - b.sort_order)
          }
        : prev
    );
    setToast(null);
  }, [toast]);

  if (!data) return <main className={shell}>Загрузка…</main>;

  const budget = summarizeRulesBudget({
    remainder: Math.max(data.remainder, 1),
    rules: data.rules,
    assets: data.assets,
    usdRubRate: rate
  });

  const segmentColors = ['#2563EB', '#34D399', '#F59E0B', '#A78BFA', '#F472B6'];
  const showFreeSegment = !budget.overBudget && budget.freePercent > 0.05;
  const hasAssets = data.assets.length > 0;

  return (
    <main className={`${shell} relative space-y-4`}>
      <UndoToast
        visible={toast != null}
        message={toast ? `Удалено «${toast.name}»` : ''}
        durationMs={UNDO_MS}
        onUndo={undoDelete}
        onDismiss={() => setToast(null)}
      />

      <PageHeader title="Правила" backTo="/settings" />
      <PageTitle
        title="Авто-распределение"
        subtitle="Правила решают, сколько остатка уйдёт в каждый актив после выплаты"
      />

      <Card className="border-0 bg-[var(--color-navy)] p-5 text-white shadow-lg">
        <div className="mb-4 flex justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Занято
            </p>
            <p
              className={`mt-0.5 text-3xl font-bold tracking-tight ${
                budget.overBudget ? 'text-red-400' : ''
              }`}
            >
              {budget.totalPercent.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Свободно
            </p>
            <p
              className={`mt-0.5 text-3xl font-bold tracking-tight ${
                budget.overBudget ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {Math.max(0, budget.freePercent).toFixed(1)}%
            </p>
          </div>
        </div>
        {budget.overBudget ? (
          <p className="mb-3 text-xs text-red-300">
            Сумма правил больше 100% остатка — уменьшите проценты или фикс.
          </p>
        ) : null}
        <div className="flex h-2.5 items-stretch gap-1">
          {budget.slices.map((slice, i) => (
            <div
              key={slice.ruleId}
              className="min-w-1 rounded-full"
              style={{
                flexGrow: Math.max(slice.percent, 0.4),
                flexBasis: 0,
                backgroundColor: segmentColors[i % segmentColors.length],
              }}
            />
          ))}
          {showFreeSegment ? (
            <div
              className="min-w-1 rounded-full bg-white/15"
              style={{
                flexGrow: Math.max(budget.freePercent, 0.4),
                flexBasis: 0,
              }}
            />
          ) : null}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Остаток цикла ≈ {formatRub(data.remainder)}. Фикс. суммы пересчитаны в % от него.
        </p>
        <div className="mt-3 space-y-1">
          {budget.slices.map((slice, i) => (
            <div key={slice.ruleId} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: segmentColors[i % segmentColors.length] }}
                />
                {slice.name}
              </span>
              <span className="text-slate-300">
                {slice.percent.toFixed(1)}% · {formatRub(slice.amountRub)}
              </span>
            </div>
          ))}
          {showFreeSegment ? (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white/15" />
                Свободно
              </span>
              <span className="text-slate-300">
                {budget.freePercent.toFixed(1)}%
              </span>
            </div>
          ) : null}
        </div>
      </Card>

      {hasAssets ? (
        <Link to="/settings/rules/new" className="block">
          <Button className="w-full" size="lg">
            <Plus className="h-4 w-4" />
            Создать правило
          </Button>
        </Link>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-blue-50 to-white ring-1 ring-blue-100">
          <div className="px-5 pt-5 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="mt-4 text-lg font-bold tracking-tight text-slate-900">
              Сначала нужен актив
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Правило направляет остаток в актив. Добавьте хотя бы один — и
              сможете создать правило.
            </p>
          </div>
          <div className="px-5 pb-5">
            <Link to="/assets/new" search={{ from: 'rules' }} className="block">
              <Button className="w-full" size="lg">
                <Plus className="h-4 w-4" />
                Создать актив
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {data.rules.map((rule) => {
          const asset = data.assets.find((a) => a.id === rule.target_asset_id);
          return (
            <SwipeToDelete key={rule.id} borderRadius={24} onDelete={() => scheduleDelete(rule)}>
              <Link
                to="/settings/rules/$id"
                params={{ id: String(rule.id) }}
                className="block p-4"
              >
                <div className="flex items-center gap-3">
                  {asset ? (
                    <AssetAvatar
                      icon={asset.icon}
                      bgColor={asset.bg_color}
                      iconColor={asset.icon_color}
                      size="md"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                      <GitBranch className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold leading-5 text-slate-900">
                      {rule.name}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-400">
                      {asset
                        ? `${asset.name} · ${
                            asset.provider === 'credit'
                              ? 'кредит'
                              : asset.provider === 'usd'
                                ? '$'
                                : '₽'
                          }`
                        : 'Без актива'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                    {rule.rule_type === 'percent' ? `${rule.value}%` : rule.value}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-4 text-slate-400">
                  {rule.rule_type === 'percent'
                    ? `${rule.value}% от остатка после расходов`
                    : 'Фиксированная сумма в валюте актива'}
                </p>
              </Link>
            </SwipeToDelete>
          );
        })}
      </div>
    </main>
  );
}

export function RuleFormScreen({
  rule,
  defaultTargetAssetId,
}: {
  rule?: DistributionRule;
  defaultTargetAssetId?: number;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const rate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rules, setRules] = useState<DistributionRule[]>([]);
  const [remainder, setRemainder] = useState(100_000);
  const [name, setName] = useState(rule?.name ?? '');
  const [target, setTarget] = useState(
    rule?.target_asset_id
      ? String(rule.target_asset_id)
      : defaultTargetAssetId
        ? String(defaultTargetAssetId)
        : '',
  );
  const [type, setType] = useState<RuleType>(rule?.rule_type ?? 'percent');
  const [value, setValue] = useState(String(rule?.value ?? '10'));
  const [creditMode, setCreditMode] = useState<'reduce_term' | 'reduce_payment'>(
    rule?.credit_early_repay_mode ?? 'reduce_term',
  );

  useEffect(() => {
    void Promise.all([
      db.getAllAssets(),
      db.getAllRules(),
      db.getAllIncomes(),
      db.getAllExpenses(),
    ]).then(([nextAssets, nextRules, incomes, expenses]) => {
      if (!rule && nextAssets.length === 0) {
        void navigate({ to: '/settings/rules', replace: true });
        return;
      }
      setAssets(nextAssets);
      setRules(nextRules);
      const report = calculateReport({
        incomes,
        expenses,
        rules: nextRules,
        assets: nextAssets,
        today: new Date(),
        usdRubRate: rate,
      });
      setRemainder(isReportError(report) ? 100_000 : Math.max(report.remainder, 1));
    });
  }, [rate, rule, navigate]);

  const selectedAsset = assets.find((a) => String(a.id) === target);
  const targetIsCreditWithRate =
    selectedAsset?.provider === 'credit' &&
    selectedAsset.credit_annual_rate != null &&
    selectedAsset.credit_annual_rate > 0;

  const availablePercent = useMemo(
    () =>
      freeRulesPercent({
        remainder,
        rules,
        assets,
        usdRubRate: rate,
        excludeRuleId: rule?.id,
      }),
    [remainder, rules, assets, rate, rule?.id],
  );

  const draftValue = numeric(value);
  const draftBudget = useMemo(() => {
    if (!target || draftValue <= 0) return null;
    return summarizeDraftRulesBudget({
      remainder,
      rules,
      draft: {
        id: rule?.id,
        name: name.trim() || 'Правило',
        rule_type: type,
        value: draftValue,
        currency: type === 'fixed' ? 'asset' : 'rub',
        target_asset_id: Number(target),
        sort_order: rule?.sort_order ?? assets.length,
        credit_early_repay_mode: targetIsCreditWithRate ? creditMode : null,
      },
      assets,
      usdRubRate: rate,
    });
  }, [
    target,
    draftValue,
    remainder,
    rules,
    rule?.id,
    rule?.sort_order,
    name,
    type,
    assets,
    targetIsCreditWithRate,
    creditMode,
    rate,
  ]);

  const overBudget = draftBudget?.overBudget ?? false;
  const canSave =
    Boolean(name.trim() && value && target && draftValue > 0) && !overBudget;

  const save = async () => {
    if (!canSave || !target) return;
    const input = {
      name,
      rule_type: type,
      value: draftValue,
      currency: type === 'fixed' ? ('asset' as const) : ('rub' as const),
      target_asset_id: Number(target),
      sort_order: rule?.sort_order ?? assets.length,
      credit_early_repay_mode: targetIsCreditWithRate ? creditMode : null,
    };
    if (rule) await db.updateRule(rule.id, input);
    else await db.createRule(input);
    if (canGoBack) {
      router.history.back();
      return;
    }
    await navigate({ to: '/settings/rules', replace: true });
  };

  return (
    <PageTransition fill>
      <main className={formShell}>
        <PageHeader title={rule ? 'Правило' : 'Новое правило'} backTo="/settings/rules" />
        <PageTitle
          title={rule ? 'Редактирование' : 'Новое правило'}
          subtitle="Выберите актив и способ расчёта суммы"
        />

        <div className={formScroll}>
          <div>
            <Label required>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Подушка безопасности"
            />
          </div>

          <div>
            <Label required>Актив</Label>
            <div className="mt-2 space-y-2">
              {assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setTarget(String(a.id));
                    if (
                      a.provider === 'credit' &&
                      a.credit_early_repay_mode
                    ) {
                      setCreditMode(a.credit_early_repay_mode);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left ${
                    target === String(a.id)
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-slate-100'
                  }`}
                >
                  <AssetAvatar
                    icon={a.icon}
                    bgColor={a.bg_color}
                    iconColor={a.icon_color}
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-slate-400">
                      {a.provider === 'credit'
                        ? 'Кредит · долг'
                        : a.provider === 'usd'
                          ? 'USD'
                          : '₽'}
                    </p>
                  </div>
                  <span
                    className={`h-5 w-5 rounded-full border-2 ${
                      target === String(a.id) ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}
                  />
                </button>
              ))}
              {!assets.length ? (
                <p className="text-sm text-slate-400">
                  Сначала создайте актив во вкладке «Активы».
                </p>
              ) : null}
            </div>
          </div>

          {targetIsCreditWithRate ? (
            <div>
              <Label>Досрочное погашение</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'reduce_term' as const,
                      title: 'Сократить срок',
                      hint: 'Платёж не меняется',
                    },
                    {
                      id: 'reduce_payment' as const,
                      title: 'Снизить платёж',
                      hint: 'Платёж пересчитаем',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCreditMode(opt.id)}
                    className={
                      creditMode === opt.id
                        ? 'rounded-2xl border-2 border-blue-600 bg-blue-50 px-3 py-2.5 text-left'
                        : 'rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left'
                    }
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {opt.title}
                    </p>
                    <p className="text-xs text-slate-400">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <Label required>Тип</Label>
            <Tabs
              value={type}
              onValueChange={(v) => {
                setType(v as RuleType);
                setValue('');
              }}
            >
              <TabsList className="mt-1.5 grid w-full grid-cols-2">
                <TabsTrigger value="percent">Процент</TabsTrigger>
                <TabsTrigger value="fixed">Фикс</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <Label required>
              {type === 'percent' ? 'Процент от остатка' : 'Фиксированная сумма'}
            </Label>
            {type === 'fixed' ? (
              <Input
                type="number"
                format="money"
                suffix={selectedAsset?.provider === 'usd' ? '$' : '₽'}
                withRelativeSuffix
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : (
              <Input
                type="number"
                format="money"
                suffix="%"
                withRelativeSuffix
                placeholder="0"
                value={value}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = Number(raw);
                  if (
                    raw === '' ||
                    /[.,]$/.test(raw) ||
                    !Number.isFinite(n)
                  ) {
                    setValue(raw);
                    return;
                  }
                  const max = Math.min(100, Math.max(0, availablePercent));
                  if (n > max) {
                    setValue(String(Math.round(max * 10) / 10));
                    return;
                  }
                  setValue(raw);
                }}
              />
            )}
            <p className="mt-1.5 text-xs text-slate-400">
              {type === 'percent' ? (
                <>
                  Считается от остатка (доход – расходы), не каскадно. Доступно{' '}
                  {availablePercent.toFixed(1)}%.
                </>
              ) : !selectedAsset ? (
                'Выберите актив — сумма будет в его валюте.'
              ) : selectedAsset.provider === 'usd' ? (
                'Валюта актива: доллары США ($). С остатка спишется эквивалент в ₽ по курсу.'
              ) : (
                'Валюта актива: рубли (₽).'
              )}
            </p>
            {overBudget ? (
              <p className="mt-1.5 text-xs font-medium text-red-500">
                Сумма правил не может быть больше 100% остатка.
              </p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-slate-100 bg-[#f8fafc] pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <Button
            className="w-full"
            size="lg"
            disabled={!canSave}
            onClick={() => void save()}
          >
            {rule ? 'Сохранить' : 'Создать'}
          </Button>
          {rule ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                if (confirm('Удалить правило?')) {
                  void db.deleteRule(rule.id).then(() => navigate({ to: '/settings/rules' }));
                }
              }}
            >
              Удалить правило
            </Button>
          ) : null}
        </div>
      </main>
    </PageTransition>
  );
}
