import {
  Button,
  Card,
  DatePicker,
  Input,
  Label,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SlidingToggleGroup
} from '@monesto/rune';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { ROUTES } from '@/shared/config/routes';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  GitBranch,
  PartyPopper,
  Pencil,
  Receipt
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode
} from 'react';

import { AssetAvatar } from '@/entities/asset';
import { AssetStylePicker } from '@/entities/asset';
import { CreditDetailScreen } from '../ui/credit-detail-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { PageTransition } from '@/shared/ui/page-transition';
import { ExchangeRateBadge } from '@/entities/exchange';
import { FadeIn } from '@/shared/ui/fade-in';
import { ErrorPage } from '@/shared/ui/error-page';
import { TrendBadge } from '../ui/goal-progress-badge';
import * as db from '@/kernel/db';
import { calcUsdValuation } from '@/entities/exchange';
import type { AssetIconName } from '@/entities/asset';
import { calculateReport, isReportError } from '@/entities/report';
import {
  findPrimaryIncome,
  listReportCycles,
  scheduleDaysFromPrimary,
} from '@/entities/report';
import { resolveCarryIn } from '@/entities/report';
import { describeGoalPace } from '@/entities/goal';
import type { Asset } from '@/kernel/types';
import { formatRub, formatUsd, toIsoDate } from '@/shared/lib/format';
import { createEmptyExpenseEntry, expensesToEntries } from '@/entities/report';
import { startOfDay } from '@/entities/report';
import { assetSlug } from '@/shared/lib/slug';
import {
  requestNotificationPermission,
  showGoalReachedNotification,
} from '@/entities/goal';
import { useExchangeRateStore } from '@/entities/exchange';
import { nestedShell, numeric } from '@/shared/lib/layout';
import { defaults } from '@/entities/asset';

const route = getRouteApi(ROUTES.assets.detail);

export function AssetDetail() {
  const { slug } = route.useParams();
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
          homeTo={ROUTES.assets.index}
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
  const [goalReachedOpen, setGoalReachedOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editGoalDeadline, setEditGoalDeadline] = useState('');
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
    setEditGoalDeadline(asset.goal_deadline ?? '');
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
          homeTo={ROUTES.assets.index}
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

      const { goalJustReached } = await db.addTransaction(
        asset.id,
        value,
        fundSource === 'free_money' ? 'Пополнение из свободных денег' : 'Пополнение',
        asset.provider === 'usd' ? value * numeric(buyRate) : undefined,
      );

      if (goalJustReached) {
        setGoalReachedOpen(true);
        void requestNotificationPermission().then((permission) => {
          if (permission === 'granted') void showGoalReachedNotification(asset.name);
        });
      }

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
      goal_deadline: editGoalDeadline.trim() || null,
      icon: editStyle.icon,
      bg_color: editStyle.bgColor,
      icon_color: editStyle.iconColor
    });
    setEditOpen(false);
    const nextSlug = assetSlug({ id: asset.id, name: editName });
    if (nextSlug !== slug) {
      await navigate({ to: ROUTES.assets.detail, params: { slug: nextSlug }, replace: true });
    } else {
      await reload();
    }
  };

  const valuation = asset.provider === 'usd' ? calcUsdValuation(asset, usdRate) : null;
  const progress =
    asset.goal_amount && asset.goal_amount > 0
      ? Math.min(100, (asset.current_amount / asset.goal_amount) * 100)
      : null;
  const goalPace =
    asset.provider !== 'credit' && asset.goal_amount
      ? describeGoalPace({
          currentAmount: asset.current_amount,
          goalAmount: asset.goal_amount,
          deadlineIso: asset.goal_deadline,
        })
      : null;

  return (
    <PageTransition>
      <main className={`${nestedShell} space-y-4`}>
        <PageHeader
          title="Актив"
          backTo={ROUTES.assets.index}
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
                  {goalPace?.detail ? (
                    <p className="mt-2 text-center text-sm font-medium leading-snug text-slate-700">
                      {goalPace.detail}
                    </p>
                  ) : goalPace ? (
                    <p className="mt-2 text-center text-sm font-medium leading-snug text-slate-700">
                      {goalPace.headline}
                    </p>
                  ) : null}
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
                  type="number"
                  format="money"
                  suffix={asset.provider === 'usd' ? '$' : '₽'}
                  withRelativeSuffix
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
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
                    to: ROUTES.settings.rules.new,
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

        <Sheet open={goalReachedOpen} onOpenChange={setGoalReachedOpen}>
          <SheetContent>
            <SheetBody className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <PartyPopper className="h-8 w-8" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Цель достигнута!</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  «{asset.name}» — накоплено{' '}
                  {asset.provider === 'usd'
                    ? formatUsd(asset.current_amount)
                    : formatRub(asset.current_amount)}
                  , план выполнен
                </p>
              </div>
            </SheetBody>
            <SheetFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setGoalReachedOpen(false)}
              >
                Ура
              </Button>
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
              <div>
                <Label>Дедлайн цели</Label>
                <DatePicker
                  placeholder="дд.мм.гггг"
                  value={editGoalDeadline}
                  onChange={(e) => setEditGoalDeadline(e.target.value)}
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