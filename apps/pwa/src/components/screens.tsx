import {
  Button,
  Card,
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
  Tabs,
  TabsList,
  TabsTrigger
} from '@monesto/rune';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  GitBranch,
  Pencil,
  Plus,
  Receipt,
  TrendingUp,
  Wallet
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { AssetStylePicker } from '@/components/assets/AssetStylePicker';
import { PageHeader, PageTitle } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { MoneyFlowStep } from '@/components/money-flow/MoneyFlowStep';
import { ReportCycleSwitcher } from '@/components/report/ReportCycleSwitcher';
import { SwipeConfirmCard } from '@/components/report/SwipeConfirmCard';
import { DangerClearButton } from '@/components/ui/DangerClearButton';
import { AppAboutFooter } from '@/components/ui/AppAboutFooter';
import { ExchangeRateBadge } from '@/components/ui/ExchangeRateBadge';
import { FadeIn } from '@/components/ui/FadeIn';
import { ErrorPage } from '@/components/ui/ErrorPage';
import { GoalProgressBadge, TrendBadge } from '@/components/ui/GoalProgressBadge';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { UndoToast } from '@/components/ui/UndoToast';
import * as db from '@/lib/db';
import { calcUsdValuation } from '@/lib/exchange/usdValuation';
import type { AssetIconName } from '@/lib/providers/assetIcons';
import { ASSET_PROVIDERS, getEnabledProviders } from '@/lib/providers/assetProviders';
import { calculateReport, isReportError } from '@/lib/report/calculateReport';
import {
  findPrimaryIncome,
  formatReportDate,
  listReportCycles,
  scheduleDaysFromPrimary,
} from '@/lib/report/dateWindow';
import { summarizeRulesBudget } from '@/lib/report/rulesBudget';
import type {
  Asset,
  DistributionRule,
  MoneyFlowEntry,
  RuleType,
  SalaryPaymentDay
} from '@/lib/types';
import { expensesToEntries, formatRub, formatUsd, incomesToEntries } from '@/lib/utils/format';
import { assetSlug } from '@/lib/utils/slug';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

const shell = 'mx-auto w-full px-5 pt-6 pb-[110px]';
/** Nested screens without tab bar. */
const nestedShell = 'mx-auto w-full px-5 pt-6 pb-8';
/** Full-viewport form: scrollable body + footer pinned to bottom. */
const formShell = 'mx-auto flex h-full min-h-0 w-full flex-col px-5 pt-6';
/** Scrollable form body — inset ring не обрезается. */
const formScroll =
  'min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-4';
const UNDO_MS = 7000;
const defaults = {
  icon: 'wallet' as AssetIconName,
  bgColor: '#DBEAFE',
  iconColor: '#2563EB'
};
const numeric = (value: string) => Math.max(0, Number(value.replace(',', '.')) || 0);

/** Схлопывает строки отчёта с одинаковым именем. */
function aggregateNamedAmounts(
  lines: { name: string; amount: number }[],
): { name: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const line of lines) {
    map.set(line.name, (map.get(line.name) ?? 0) + line.amount);
  }
  return [...map.entries()].map(([name, amount]) => ({ name, amount }));
}

function ReportBreakdown({
  lines,
  emptyLabel,
  tone,
}: {
  lines: { name: string; amount: number }[];
  emptyLabel: string;
  tone: 'income' | 'expense';
}) {
  const items = aggregateNamedAmounts(lines);
  const text = tone === 'income' ? 'text-emerald-700/75' : 'text-rose-700/75';

  if (!items.length) {
    return <p className={`mt-1.5 text-[11px] leading-4 ${text}`}>{emptyLabel}</p>;
  }

  return (
    <ul className="mt-1.5 space-y-1">
      {items.map((item) => (
        <li
          key={item.name}
          className={`flex items-start justify-between gap-2 text-[11px] leading-4 ${text}`}
        >
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          <span className="shrink-0 font-semibold tabular-nums">
            {formatRub(item.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HomeScreen() {
  const [data, setData] = useState<{
    assets: Asset[];
    incomes: Awaited<ReturnType<typeof db.getAllIncomes>>;
    expenses: Awaited<ReturnType<typeof db.getAllExpenses>>;
    rules: DistributionRule[];
  } | null>(null);
  const [day, setDay] = useState<SalaryPaymentDay | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<number[]>([]);
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);
  const rate = useExchangeRateStore((s) => s.usdRubRate);

  const reload = useCallback(async () => {
    const [assets, incomes, expenses, rules] = await Promise.all([
      db.getAllAssets(),
      db.getAllIncomes(),
      db.getAllExpenses(),
      db.getAllRules()
    ]);
    setData({ assets, incomes, expenses, rules });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const cycles = useMemo(() => {
    const primary = data ? findPrimaryIncome(data.incomes) : undefined;
    return listReportCycles(new Date(), scheduleDaysFromPrimary(primary));
  }, [data]);
  const selectedDay =
    day ?? cycles.find((c) => !c.isPreview)?.paymentDay ?? cycles[0]?.paymentDay ?? 25;

  useEffect(() => {
    if (day != null && cycles.length && !cycles.some((c) => c.paymentDay === day)) {
      setDay(null);
    }
  }, [cycles, day]);

  const report = useMemo(() => {
    if (!data) return null;
    return calculateReport({
      ...data,
      today: new Date(),
      cyclePaymentDay: selectedDay,
      usdRubRate: rate ?? undefined
    });
  }, [data, selectedDay, rate]);

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

  if (!data || !report) {
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
      }
    }
    if (newlyConfirmed.length && totalRub > 0) {
      await db.depositFromAllocation(assetId, totalRub, rate ?? 82, 'Распределение из отчёта');
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
        <ReportCycleSwitcher cycles={cycles} selectedDay={selectedDay} onSelect={setDay} />
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

      <div className="space-y-3">
        <FadeIn index={0} baseDelay={180} step={140} variant="rise" durationClass="duration-700">
          <Card className="border-0 bg-[var(--color-navy)] p-5 text-white shadow-lg">
            <p className="text-sm text-slate-300">Свободные деньги</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{formatRub(report.freeMoney)}</p>
          </Card>
        </FadeIn>

        <div className="grid grid-cols-2 items-stretch gap-3">
          <FadeIn
            index={1}
            baseDelay={180}
            step={140}
            variant="rise"
            durationClass="duration-700"
            className="h-full"
          >
            <Card className="flex h-full flex-col border-0 bg-[var(--color-income-soft)] p-4 shadow-none">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-income)]">
                Доходы
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--color-income)]">
                {formatRub(report.totalIncome)}
              </p>
              <div className="mt-2">
                <ReportBreakdown
                  lines={report.incomeLines}
                  emptyLabel="Нет доходов в цикле"
                  tone="income"
                />
              </div>
            </Card>
          </FadeIn>
          <FadeIn
            index={2}
            baseDelay={180}
            step={140}
            variant="rise"
            durationClass="duration-700"
            className="h-full"
          >
            <Card className="flex h-full flex-col border-0 bg-[var(--color-expense-soft)] p-4 shadow-none">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-expense)]">
                Расходы
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--color-expense)]">
                {formatRub(report.totalExpenses)}
              </p>
              <div className="mt-2">
                <ReportBreakdown
                  lines={report.expenseLines}
                  emptyLabel="Нет расходов в цикле"
                  tone="expense"
                />
              </div>
            </Card>
          </FadeIn>
        </div>

        <FadeIn index={3} baseDelay={180} step={140} variant="rise" durationClass="duration-700">
          <Card className="border-slate-100 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Остаток до правил</p>
            <p className="text-xl font-bold text-slate-900">{formatRub(report.remainder)}</p>
            <p className="mt-1 text-xs text-slate-400">
              Распределение: −{formatRub(report.totalAllocations)}
            </p>
          </Card>
        </FadeIn>
      </div>

      <section className="space-y-1">
        <FadeIn index={8} baseDelay={40} step={55}>
          <h2 className="font-bold text-slate-900">Ваши активы</h2>
          <p className="mb-3 text-xs leading-relaxed text-slate-400">
            {report.isPreview
              ? 'Сюда попадёт остаток после расходов по вашим правилам. В плане будущего цикла подтверждения ещё недоступны.'
              : 'Сюда попадает остаток после расходов — суммы по правилам распределения. Свайп вправо — применить, влево — отклонить.'}
          </p>
        </FadeIn>
        {(() => {
          const reportAssets = (report.assetSummary ?? []).filter(
            (asset) => (allocationsByAsset.get(asset.id) ?? []).length > 0
          );
          if (!reportAssets.length) {
            const hasAnyAssets = data.assets.length > 0;
            return (
              <FadeIn index={9} baseDelay={40} step={55}>
                <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50/60 px-4 py-4 text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    {hasAnyAssets ? 'Пока нечего распределять' : 'Активов пока нет'}
                  </p>
                  <p className="mx-auto mt-1 max-w-[260px] text-xs leading-snug text-slate-400">
                    {hasAnyAssets
                      ? 'Добавьте правило — актив появится в отчёте цикла.'
                      : 'Создайте актив, чтобы направлять свободные деньги.'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                    <Link to="/assets/new">
                      <Button variant="secondary" size="sm">
                        <Plus className="h-3.5 w-3.5" />
                        Создать актив
                      </Button>
                    </Link>
                    {hasAnyAssets ? (
                      <Link
                        to="/settings/rules/new"
                        className="text-xs font-medium text-slate-400 transition-colors hover:text-blue-600"
                      >
                        Добавить правило
                      </Link>
                    ) : null}
                  </div>
                </div>
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
                    asset.provider === 'usd'
                      ? `${formatUsd(asset.nativeAmount)} · ${formatRub(asset.rubEquivalent)}`
                      : formatRub(asset.nativeAmount)
                  }
                  incomingRub={displayIncoming}
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
    </main>
  );
}

export function AssetsScreen() {
  const [assets, setAssets] = useState<Asset[] | null>(null);
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
    setAssets((prev) => [...(prev ?? []), pending.asset].sort((a, b) => a.id - b.id));
    setToast(null);
  }, [toast]);

  const reload = async () => {
    const next = await db.getAllAssets();
    const pendingIds = new Set(pendingRef.current.keys());
    setAssets(next.filter((asset) => !pendingIds.has(asset.id)));
  };

  useEffect(() => {
    void reload();
  }, []);

  if (!assets) return <main className={shell}>Загрузка…</main>;

  const total = assets.reduce(
    (sum, a) => sum + (a.provider === 'usd' ? a.current_amount * rate : a.current_amount),
    0
  );

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
        <Card className="border-0 bg-blue-50 p-5 shadow-none">
          <p className="text-xs lowercase text-slate-400">итого</p>
          <p className="text-3xl font-bold text-slate-900">{formatRub(total)}</p>
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <h2 className="font-bold text-slate-900">Ваши активы</h2>
      </FadeIn>
      <div className="space-y-3">
        {assets.map((a, i) => {
          const hasGoal = a.goal_amount != null && a.goal_amount > 0;
          const valuation = a.provider === 'usd' ? calcUsdValuation(a, rate) : null;
          const usdTrend =
            valuation?.profitPercent != null
              ? `${valuation.profitPercent >= 0 ? '+' : ''}${valuation.profitPercent}%`
              : null;
          return (
            <FadeIn key={a.id} index={3 + i}>
              <SwipeToDelete borderRadius={16} onDelete={() => scheduleDelete(a)}>
                <Link
                  to="/assets/$slug"
                  params={{ slug: assetSlug(a) }}
                  className="flex items-center gap-3 px-3 py-3.5"
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
              </SwipeToDelete>
            </FadeIn>
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

export function AssetFormScreen({ asset }: { asset?: Asset }) {
  const navigate = useNavigate();
  const [name, setName] = useState(asset?.name ?? '');
  const [purpose, setPurpose] = useState(asset?.purpose ?? '');
  const [provider, setProvider] = useState(asset?.provider ?? 'rub');
  const [goal, setGoal] = useState(asset?.goal_amount ? String(asset.goal_amount) : '');
  const [amount, setAmount] = useState(asset ? String(asset.current_amount) : '');
  const [rate, setRate] = useState('82');
  const [style, setStyle] = useState({
    icon: (asset?.icon as AssetIconName) || defaults.icon,
    bgColor: asset?.bg_color ?? defaults.bgColor,
    iconColor: asset?.icon_color ?? defaults.iconColor
  });

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
    const id = await db.createAsset({
      name,
      purpose,
      provider,
      goal_amount: goal ? numeric(goal) : undefined,
      current_amount: numeric(amount || '0'),
      cost_basis_rub: provider === 'usd' ? numeric(amount || '0') * numeric(rate) : undefined,
      icon: style.icon,
      bg_color: style.bgColor,
      icon_color: style.iconColor
    });
    await navigate({
      to: '/assets/$slug',
      params: { slug: assetSlug({ id, name }) }
    });
  };

  return (
    <PageTransition fill>
      <main className={formShell}>
        <PageHeader title={asset ? 'Редактировать' : 'Новый актив'} backTo="/assets" />

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
                <Label required>Провайдер</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as Asset['provider'])}>
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
                <Label>Текущая сумма{provider === 'rub' ? ', ₽' : ', $'}</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
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
            </>
          ) : null}

          <div>
            <Label>Цель накопления</Label>
            <div className="relative">
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                inputMode="decimal"
                placeholder="Необязательно"
                className="pr-8"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {provider === 'usd' ? '$' : '₽'}
              </span>
            </div>
          </div>

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
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof db.getTransactions>>>(
    []
  );
  const [amount, setAmount] = useState('');
  const [buyRate, setBuyRate] = useState('82');
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);
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
      setLoadState('missing');
      return;
    }
    setAsset(next);
    setTransactions(await db.getTransactions(next.id));
    setLoadState('ready');
  }, [slug]);

  useEffect(() => {
    setLoadState('loading');
    void reload();
  }, [reload]);

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

  const change = async () => {
    const value = numeric(amount);
    if (!value || !mode) return;
    await db.addTransaction(
      asset.id,
      mode === 'deposit' ? value : -value,
      mode === 'deposit' ? 'Пополнение' : 'Списание',
      asset.provider === 'usd' && mode === 'deposit' ? value * numeric(buyRate) : undefined
    );
    setMode(null);
    setAmount('');
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
          <Button size="lg" variant="secondary" onClick={() => setMode('withdraw')}>
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

        <Sheet open={mode != null} onOpenChange={(o) => !o && setMode(null)}>
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
            </SheetBody>
            <SheetFooter>
              <Button className="w-full" size="lg" onClick={() => void change()}>
                Подтвердить
              </Button>
              <button
                type="button"
                className="w-full py-2 text-sm text-slate-400"
                onClick={() => setMode(null)}
              >
                Отмена
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
                <Label>Цель накопления</Label>
                <div className="relative">
                  <Input
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    inputMode="decimal"
                    placeholder="Необязательно"
                    className="pr-8"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {asset.provider === 'usd' ? '$' : '₽'}
                  </span>
                </div>
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

  const clear = async () => {
    await db.clearAllData();
    await navigate({ to: '/onboarding' });
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
    }
  ];

  return (
    <main className={`${shell} space-y-4`}>
      <FadeIn variant="fade">
        <PageTitle title="Настройки" subtitle="Доходы, расходы и правила распределения" />
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
        <DangerClearButton onConfirm={clear} />
      </FadeIn>

      <FadeIn index={3} variant="fade">
        <AppAboutFooter />
      </FadeIn>
    </main>
  );
}

export function MoneyFlowScreen({
  mode,
  onboarding
}: {
  mode: 'income' | 'expense';
  onboarding?: boolean;
}) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MoneyFlowEntry[] | null>(null);

  useEffect(() => {
    void (mode === 'income'
      ? db.getAllIncomes().then((x) => setEntries(incomesToEntries(x)))
      : db.getAllExpenses().then((x) => setEntries(expensesToEntries(x))));
  }, [mode]);

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

    if (onboarding && mode === 'income') {
      await navigate({ to: '/onboarding/expenses' });
      return;
    }
    if (onboarding && mode === 'expense') {
      await db.completeOnboarding();
      await navigate({ to: '/' });
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
          mode={mode}
          title={mode === 'income' ? 'Ваши доходы' : 'Обязательные расходы'}
          subtitle={
            onboarding
              ? mode === 'income'
                ? 'Задайте зарплату и другие поступления'
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

  const colors = ['#2563EB', '#34D399', '#F59E0B', '#A78BFA', '#F472B6'];

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
            <p className="text-xs text-slate-400">Занято от остатка</p>
            <p className="text-2xl font-bold">{budget.totalPercent.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Свободно</p>
            <p className="text-2xl font-bold text-emerald-400">{Math.round(budget.freePercent)}%</p>
          </div>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-700">
          {budget.slices.map((slice, i) => (
            <div
              key={slice.ruleId}
              style={{
                width: `${Math.min(100, slice.percent)}%`,
                backgroundColor: colors[i % colors.length]
              }}
            />
          ))}
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
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                {slice.name}
              </span>
              <span className="text-slate-300">
                {slice.percent.toFixed(1)}% · {formatRub(slice.amountRub)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Link to="/settings/rules/new" className="block">
        <Button className="w-full" size="lg">
          <Plus className="h-4 w-4" />
          Создать правило
        </Button>
      </Link>

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
                        ? `${asset.name} · ${asset.provider === 'usd' ? '$' : '₽'}`
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

export function RuleFormScreen({ rule }: { rule?: DistributionRule }) {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [name, setName] = useState(rule?.name ?? '');
  const [target, setTarget] = useState(rule?.target_asset_id ? String(rule.target_asset_id) : '');
  const [type, setType] = useState<RuleType>(rule?.rule_type ?? 'percent');
  const [value, setValue] = useState(String(rule?.value ?? '10'));

  useEffect(() => {
    void db.getAllAssets().then(setAssets);
  }, []);

  const save = async () => {
    if (!name.trim() || !value || !target) return;
    const input = {
      name,
      rule_type: type,
      value: numeric(value),
      currency: type === 'fixed' ? ('asset' as const) : ('rub' as const),
      target_asset_id: Number(target),
      sort_order: rule?.sort_order ?? assets.length
    };
    if (rule) await db.updateRule(rule.id, input);
    else await db.createRule(input);
    await navigate({ to: '/settings/rules' });
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
            <Label>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Подушка безопасности"
            />
          </div>

          <div>
            <Label>Актив</Label>
            <div className="mt-2 space-y-2">
              {assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setTarget(String(a.id))}
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
                    <p className="text-sm text-slate-400">{a.provider === 'usd' ? 'USD' : '₽'}</p>
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

          <div>
            <Label>Тип</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as RuleType)}>
              <TabsList className="mt-1.5 grid w-full grid-cols-2">
                <TabsTrigger value="percent">Процент</TabsTrigger>
                <TabsTrigger value="fixed">Фикс</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <Label>{type === 'percent' ? 'Процент от остатка' : 'Фиксированная сумма'}</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
            <p className="mt-1.5 text-xs text-slate-400">
              Считается от остатка (доход – расходы), не каскадно
            </p>
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-slate-100 bg-[#f8fafc] pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <Button className="w-full" size="lg" onClick={() => void save()}>
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
