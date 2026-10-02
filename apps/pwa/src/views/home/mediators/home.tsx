import {
  Button,
  Card,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter
} from '@monesto/rune';
import { Link, useRouterState } from '@tanstack/react-router';
import { ROUTES } from '@/shared/config/routes';
import {
  ChevronRight,
  GitBranch,
  History,
  Minus,
  PartyPopper,
  Plus,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { PageTitle } from '@/shared/ui/page-header';
import {
  ReportCycleSwitcher,
  reportCycleKey,
} from '@/entities/report';
import {
  CarryoverEditSheet,
  CarryoverIncomeCard,
} from '@/entities/report';
import { CarryInWizardSheet } from '../ui/carry-in-wizard-sheet';
import { QuickOneTimeSheet } from '../ui/quick-one-time-sheet';
import { SwipeConfirmCard } from '../ui/swipe-confirm-card';
import { PlannedExpenseConfirmSheet } from '../ui/planned-expense-confirm-sheet';
import { PlannedPeriodEntryCard } from '../ui/planned-period-entry-card';
import { PlannedPeriodSheet } from '../ui/planned-period-sheet';
import { WishlistEntryCard } from '../ui/wishlist-entry-card';
import { ExchangeRateBadge } from '@/entities/exchange';
import { FadeIn } from '@/shared/ui/fade-in';
import { BackupReminderBanner } from '../ui/backup-reminder-banner';
import { SeasonalTipBanner } from '../ui/seasonal-tip-banner';
import { VacationBanner } from '../ui/vacation-banner';
import { WishlistAnnouncementBanner } from '../ui/wishlist-announcement-banner';
import { YearSummaryBanner } from '../ui/year-summary-banner';
import * as db from '@/kernel/db';
import { plannedWishlistItemsInPeriod, resolveSpendDateIso } from '@/entities/wishlist';
import {
  isBackupBannerEnabled,
  isYearSummaryEnabled,
  shouldShowVacationBanner,
} from '@/kernel/features';
import {
  computeYearSummary,
  type YearSummary,
} from '@/entities/year-summary';
import { calculateReport, isReportError } from '@/entities/report';
import { computeCycleHistory } from '@/entities/report';
import {
  findPrimaryIncome,
  formatReportDate,
  listReportCycles,
  scheduleDaysFromPrimary,
} from '@/entities/report';
import { resolveCarryIn } from '@/entities/report';
import {
  summarizeRulesBudget,
} from '@/entities/report';
import { getSeasonalTips } from '../lib/tips';
import type {
  Asset,
  DistributionRule,
  VacationPeriod,
  WishlistItem,
} from '@/kernel/types';
import { formatRub, formatUsd, toIsoDate } from '@/shared/lib/format';
import {
  requestNotificationPermission,
  showGoalReachedNotification,
} from '@/entities/goal';
import { useCycleSelectionStore } from '../model/cycle-selection-store';
import { useExchangeRateStore } from '@/entities/exchange';
import { numeric, shell } from '@/shared/lib/layout';

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


export function Home() {
  const [data, setData] = useState<{
    assets: Asset[];
    incomes: Awaited<ReturnType<typeof db.getAllIncomes>>;
    expenses: Awaited<ReturnType<typeof db.getAllExpenses>>;
    rules: DistributionRule[];
    vacations: VacationPeriod[];
    wishlistItems: WishlistItem[];
  } | null>(null);
  const cycleKey = useCycleSelectionStore((s) => s.cycleKey);
  const setCycleKey = useCycleSelectionStore((s) => s.setCycleKey);
  const [confirmedIds, setConfirmedIds] = useState<number[]>([]);
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);
  const [plannedExpenseTarget, setPlannedExpenseTarget] =
    useState<WishlistItem | null>(null);
  const [plannedPeriodOpen, setPlannedPeriodOpen] = useState(false);
  const [yearSummary, setYearSummary] = useState<YearSummary | null>(null);
  const [carryTick, setCarryTick] = useState(0);
  const [carryEditOpen, setCarryEditOpen] = useState(false);
  const [carryDraft, setCarryDraft] = useState('');
  const [trackingStartedAt, setTrackingStartedAt] = useState<Date | null>(null);
  const [quickOneTimeMode, setQuickOneTimeMode] = useState<
    'income' | 'expense' | null
  >(null);
  const [celebrateAsset, setCelebrateAsset] = useState<Asset | null>(null);
  const [showBackupBanner, setShowBackupBanner] = useState(false);
  const [showWishlistAnnouncement, setShowWishlistAnnouncement] = useState(false);
  const [carryWizardOpen, setCarryWizardOpen] = useState(false);
  const [seasonalTipId, setSeasonalTipId] = useState<string | null>(null);
  const [historyPreview, setHistoryPreview] = useState<{
    label: string;
    remainder: number;
  } | null>(null);
  const rate = useExchangeRateStore((s) => s.usdRubRate);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const reload = useCallback(async () => {
    const [assets, incomes, expenses, rules, vacations, wishlistItems] =
      await Promise.all([
        db.getAllAssets(),
        db.getAllIncomes(),
        db.getAllExpenses(),
        db.getAllRules(),
        db.getAllVacations(),
        db.getAllWishlistItems(),
      ]);
    setData({ assets, incomes, expenses, rules, vacations, wishlistItems });

    setShowWishlistAnnouncement(!db.isWishlistAnnouncementSeenSync());

    if (!isBackupBannerEnabled()) {
      setShowBackupBanner(false);
    } else {
      const lastExport = db.getLastBackupExportAtSync();
      const daysSinceExport = lastExport
        ? (Date.now() - lastExport.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;
      setShowBackupBanner(
        assets.length > 0 &&
          daysSinceExport > 30 &&
          !db.isBackupBannerSnoozedSync(),
      );
    }

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

    const history = computeCycleHistory({
      incomes,
      expenses,
      rules,
      assets,
      vacations,
      today: new Date(),
      usdRubRate: rate ?? 82,
      monthsBack: 6,
      trackingStartedAt: db.getTrackingStartedAtSync(),
    });
    const latest = history[0] ?? null;
    setHistoryPreview(
      latest
        ? { label: latest.label, remainder: latest.remainder }
        : null,
    );

    const tip = getSeasonalTips(new Date()).find(
      (item) => !db.isSeasonalTipSnoozedSync(item.id),
    );
    setSeasonalTipId(tip?.id ?? null);
  }, [rate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (pathname === ROUTES.home) void reload();
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
    if (!selectedCycle || selectedCycle.isPreview || !carryIn) {
      setCarryWizardOpen(false);
      return;
    }
    const key = reportCycleKey(selectedCycle);
    const shouldAsk =
      carryIn.hasPreviousCycle &&
      carryIn.suggestedRub > 0 &&
      !carryIn.isOverride &&
      !db.isCarryInWizardDoneSync(key);
    setCarryWizardOpen(shouldAsk);
  }, [carryIn, selectedCycle, carryTick]);

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
        <Link to={ROUTES.settings.vacation}>
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
        <Link to={ROUTES.settings.income}>
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

  /** Хотелки, запланированные на ближайший период (окно текущего цикла). */
  const plannedInPeriod = plannedWishlistItemsInPeriod(
    data.wishlistItems,
    toIsoDate(selectedCycle.expenseStart),
    toIsoDate(selectedCycle.expenseEndExclusive),
  );

  /** Показываем вишлист, только если свободных денег хватит хотя бы на один предмет. */
  const affordableWishlistItems = data.wishlistItems
    .filter((item) => !item.planned_date)
    .filter((item) => item.price == null || item.price <= freeMoney)
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

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
        const { goalJustReached } = await db.depositFromAllocation(
          assetId,
          totalRub,
          rate ?? 82,
          'Распределение из отчёта',
        );
        if (goalJustReached && target) {
          setCelebrateAsset(target);
          void requestNotificationPermission().then((permission) => {
            if (permission === 'granted') void showGoalReachedNotification(target.name);
          });
        }
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

  const spendPlannedExpense = async (amountRub: number) => {
    if (!plannedExpenseTarget) return;
    await db.convertWishlistItemToExpense(
      plannedExpenseTarget.id,
      amountRub,
      resolveSpendDateIso(plannedExpenseTarget, toIsoDate(new Date())),
    );
    setPlannedExpenseTarget(null);
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

      {showBackupBanner ? (
        <FadeIn index={0}>
          <BackupReminderBanner
            onExported={() => setShowBackupBanner(false)}
            onDismiss={() => {
              setShowBackupBanner(false);
              void db.snoozeBackupBanner();
            }}
          />
        </FadeIn>
      ) : null}

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

      {seasonalTipId
        ? (() => {
            const tip = getSeasonalTips(new Date()).find(
              (item) => item.id === seasonalTipId,
            );
            if (!tip) return null;
            return (
              <FadeIn index={4}>
                <SeasonalTipBanner
                  tip={tip}
                  onDismiss={() => {
                    void db.snoozeSeasonalTip(tip.id).then(() => {
                      setSeasonalTipId(null);
                    });
                  }}
                />
              </FadeIn>
            );
          })()
        : null}

      {showWishlistAnnouncement ? (
        <FadeIn index={5}>
          <WishlistAnnouncementBanner
            onDismiss={() => {
              setShowWishlistAnnouncement(false);
              void db.markWishlistAnnouncementSeen();
            }}
          />
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

        {plannedInPeriod.length > 0 ? (
          <FadeIn index={2} baseDelay={180} step={140} variant="rise" durationClass="duration-700">
            <PlannedPeriodEntryCard
              count={plannedInPeriod.length}
              topName={plannedInPeriod[0]!.name}
              onClick={() => setPlannedPeriodOpen(true)}
            />
          </FadeIn>
        ) : null}

        {affordableWishlistItems.length > 0 ? (
          <FadeIn index={3} baseDelay={180} step={140} variant="rise" durationClass="duration-700">
            <WishlistEntryCard
              count={affordableWishlistItems.length}
              topName={affordableWishlistItems[0]!.name}
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
              void db.markCarryInWizardDone(report.cycleKey);
              setCarryTick((n) => n + 1);
              setCarryEditOpen(false);
              setCarryWizardOpen(false);
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

      <CarryInWizardSheet
        open={carryWizardOpen && !report.isPreview && !carryEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            void db.markCarryInWizardDone(report.cycleKey).then(() => {
              setCarryWizardOpen(false);
            });
          }
        }}
        suggestedRub={carryIn?.suggestedRub ?? 0}
        onConfirmSuggested={() => {
          void db.markCarryInWizardDone(report.cycleKey).then(() => {
            setCarryWizardOpen(false);
          });
        }}
        onSaveCustom={(amountRub) => {
          void db
            .setCarryoverOverride(report.cycleKey, amountRub)
            .then(() => db.markCarryInWizardDone(report.cycleKey))
            .then(() => {
              setCarryTick((n) => n + 1);
              setCarryWizardOpen(false);
            });
        }}
        onSkip={() => {
          void db.markCarryInWizardDone(report.cycleKey).then(() => {
            setCarryWizardOpen(false);
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

      <PlannedExpenseConfirmSheet
        item={plannedExpenseTarget}
        onOpenChange={(open) => {
          if (!open) setPlannedExpenseTarget(null);
        }}
        onConfirm={(amountRub) => void spendPlannedExpense(amountRub)}
      />

      <PlannedPeriodSheet
        items={plannedInPeriod}
        freeMoney={freeMoney}
        open={plannedPeriodOpen}
        onOpenChange={setPlannedPeriodOpen}
        onSpend={(item) => setPlannedExpenseTarget(item)}
        onChanged={() => void reload()}
      />

      <Sheet
        open={celebrateAsset != null}
        onOpenChange={(open) => {
          if (!open) setCelebrateAsset(null);
        }}
      >
        <SheetContent>
          <SheetBody className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <PartyPopper className="h-8 w-8" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Цель достигнута!</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                «{celebrateAsset?.name}» — план накопления выполнен
              </p>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button className="w-full" size="lg" onClick={() => setCelebrateAsset(null)}>
              Ура
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
                  to={hasAnyAssets ? ROUTES.settings.rules.new : ROUTES.assets.new}
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
              to={ROUTES.settings.income}
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
              to={ROUTES.settings.expenses}
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
          <Link to={ROUTES.settings.rules.index} className="block">
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

        {historyPreview ? (
          <FadeIn
            index={originStart + 4}
            baseDelay={40}
            step={55}
            variant="rise"
            durationClass="duration-700"
          >
            <Link to={ROUTES.history} className="block">
              <Card className="border-slate-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <History className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">История циклов</p>
                    <p className="text-sm text-slate-400">
                      {historyPreview.label} ·{' '}
                      {historyPreview.remainder >= 0 ? '+' : ''}
                      {formatRub(historyPreview.remainder)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                </div>
              </Card>
            </Link>
          </FadeIn>
        ) : null}
      </section>
    </main>
  );
}