import {
  Button,
  Card,
  Input,
  Label,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@monesto/rune';
import { Link, useNavigate } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { AssetStylePicker } from '@/components/assets/AssetStylePicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { FadeIn } from '@/components/ui/FadeIn';
import { ErrorPage } from '@/components/ui/ErrorPage';
import * as db from '@/lib/db';
import {
  buildCreditClosingPlan,
  creditMonthsLeft,
  creditMonthsPaid,
  creditPayoffMonthsLeft,
  creditRemainingMonthsFromSchedule,
  creditRepaidAmount,
  creditRepaidRatio,
  hasCreditInterest,
  previewEarlyRepayment,
  resolveCreditPayment,
  type CreditEarlyRepayMode,
} from '@/lib/credit/plan';
import type { AssetIconName } from '@/lib/providers/assetIcons';
import type { Asset, Expense } from '@/lib/types';
import { formatRub } from '@/lib/utils/format';
import { assetSlug } from '@/lib/utils/slug';

const nestedShell = 'mx-auto w-full px-5 pt-6 pb-8';
const numeric = (value: string) => Math.max(0, Number(value.replace(',', '.')) || 0);

const MONTHS_SHORT = [
  'янв.',
  'фев.',
  'мар.',
  'апр.',
  'мая',
  'июн.',
  'июл.',
  'авг.',
  'сен.',
  'окт.',
  'ноя.',
  'дек.',
];

export function CreditDetailScreen({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<
    Awaited<ReturnType<typeof db.getTransactions>>
  >([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>(
    'loading',
  );
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<CreditEarlyRepayMode>('reduce_term');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editTerm, setEditTerm] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editStyle, setEditStyle] = useState({
    icon: 'card' as AssetIconName,
    bgColor: '#FEF2F2',
    iconColor: '#991B1B',
  });

  const reload = useCallback(async () => {
    const next = await db.getAssetBySlug(slug);
    if (!next || next.provider !== 'credit') {
      setAsset(null);
      setLoadState('missing');
      return;
    }
    const [txs, allExpenses] = await Promise.all([
      db.getTransactions(next.id),
      db.getAllExpenses(),
    ]);
    setAsset(next);
    setTransactions(txs);
    setExpenses(allExpenses);
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
    setEditRate(
      asset.credit_annual_rate != null ? String(asset.credit_annual_rate) : '',
    );
    setEditTerm(
      asset.credit_term_months != null ? String(asset.credit_term_months) : '',
    );
    setEditStartDate(asset.credit_start_date ?? '');
    setEditStyle({
      icon: (asset.icon as AssetIconName) || 'card',
      bgColor: asset.bg_color,
      iconColor: asset.icon_color,
    });
  }, [asset, editOpen]);

  useEffect(() => {
    if (!payOpen || !asset) return;
    setPayMode(asset.credit_early_repay_mode ?? 'reduce_term');
  }, [payOpen, asset]);

  const payment = useMemo(
    () => (asset ? resolveCreditPayment(asset, expenses) : null),
    [asset, expenses],
  );

  const withInterest = asset ? hasCreditInterest(asset) : false;
  const annualRate = withInterest ? (asset!.credit_annual_rate as number) : null;

  const plan = useMemo(() => {
    if (!asset || !payment || payment.amount <= 0) return [];
    return buildCreditClosingPlan({
      remainingDebt: asset.current_amount,
      monthlyPayment: payment.amount,
      paymentDay: payment.dueDay ?? 10,
      annualPercent: annualRate,
      steps: 6,
    });
  }, [asset, payment, annualRate]);

  const payPreview = useMemo(() => {
    if (!asset || !withInterest || !payment) return null;
    const value = numeric(payAmount);
    if (!value) return null;
    return previewEarlyRepayment({
      asset,
      monthlyPayment: payment.amount,
      extraPayment: value,
      mode: payMode,
      dueDay: payment.dueDay,
    });
  }, [asset, payment, payAmount, payMode, withInterest]);

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
          title="Кредит не найден"
          message="Этот кредит удалён или ссылка устарела."
          homeTo="/assets"
          homeLabel="К активам"
        />
      </PageTransition>
    );
  }

  const repaidRatio = creditRepaidRatio(asset);
  const repaid = creditRepaidAmount(asset);
  const contractMonthsLeft =
    asset.credit_start_date &&
    asset.credit_term_months &&
    payment?.dueDay
      ? creditRemainingMonthsFromSchedule({
          startDate: asset.credit_start_date,
          termMonths: asset.credit_term_months,
          paymentDay: payment.dueDay,
        })
      : null;
  const payoffMonthsLeft =
    withInterest && payment && payment.amount > 0 && annualRate != null
      ? creditPayoffMonthsLeft(
          asset.current_amount,
          payment.amount,
          annualRate,
        )
      : creditMonthsLeft(
          asset.current_amount,
          payment?.amount ?? 0,
          annualRate,
        );
  const monthsLeft = payoffMonthsLeft;
  const monthsPaid =
    asset.credit_start_date && payment?.dueDay
      ? creditMonthsPaid({
          startDate: asset.credit_start_date,
          paymentDay: payment.dueDay,
        })
      : null;
  const totalMonths =
    withInterest && asset.credit_term_months
      ? asset.credit_term_months
      : payment && payment.amount > 0 && (asset.goal_amount ?? 0) > 0
        ? Math.ceil((asset.goal_amount as number) / payment.amount)
        : null;

  const repay = async () => {
    const value = numeric(payAmount);
    if (!value) return;
    await db.addTransaction(asset.id, value, 'Досрочное погашение', value, {
      earlyRepayMode: withInterest ? payMode : null,
    });
    setPayOpen(false);
    setPayAmount('');
    await reload();
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    const rate = editRate.trim() ? numeric(editRate) : null;
    const term = editTerm.trim()
      ? Math.max(1, Math.round(numeric(editTerm)))
      : null;
    const startDate = editStartDate.trim() || null;
    const paymentDay = payment?.dueDay ?? 10;
    const remaining =
      startDate && term
        ? creditRemainingMonthsFromSchedule({
            startDate,
            termMonths: term,
            paymentDay,
          })
        : null;
    const hasRate = rate != null && rate > 0;
    await db.updateAsset(asset.id, {
      name: editName,
      purpose: editPurpose || null,
      goal_amount: editGoal ? numeric(editGoal) : null,
      icon: editStyle.icon,
      bg_color: editStyle.bgColor,
      icon_color: editStyle.iconColor,
      credit_annual_rate: hasRate ? rate : null,
      credit_term_months: hasRate ? term : null,
      credit_start_date: hasRate ? startDate : null,
      credit_remaining_months: hasRate ? remaining : null,
    });
    setEditOpen(false);
    const nextSlug = assetSlug({ id: asset.id, name: editName });
    if (nextSlug !== slug) {
      await navigate({
        to: '/assets/$slug',
        params: { slug: nextSlug },
        replace: true,
      });
    } else {
      await reload();
    }
  };

  const history = transactions.filter(
    (tx) => tx.note !== 'Начальный долг' || tx.amount_delta < 0,
  );

  return (
    <PageTransition>
      <main className={`${nestedShell} space-y-4`}>
        <PageHeader
          title="Кредит"
          backTo="/assets"
          right={
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label="Редактировать"
            >
              <Pencil className="h-5 w-5 text-blue-600" />
            </button>
          }
        />

        <FadeIn variant="fade" className="flex flex-col items-center gap-2 pt-1">
          <AssetAvatar
            icon={asset.icon}
            bgColor={asset.bg_color}
            iconColor={asset.icon_color}
            size="lg"
          />
          <div className="px-2 text-center">
            <span className="rounded-full bg-[var(--color-expense-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-expense)]">
              Долг
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900">
              {asset.name}
            </h1>
            {asset.purpose?.trim() ? (
              <p className="mt-1 text-sm text-slate-400">{asset.purpose.trim()}</p>
            ) : null}
            {withInterest && annualRate != null ? (
              <p className="mt-1 text-xs text-slate-400">
                {annualRate}% годовых
                {asset.credit_term_months
                  ? ` · ${asset.credit_term_months} мес.`
                  : ''}
                {monthsPaid != null ? ` · платите ${monthsPaid} мес.` : ''}
              </p>
            ) : null}
          </div>
        </FadeIn>

        <FadeIn index={1}>
          <Card className="overflow-hidden border-slate-100 p-0 shadow-sm">
            <div className="bg-gradient-to-br from-rose-50 via-white to-slate-50 px-5 py-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-rose-700/60">
                Остаток долга
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                {formatRub(asset.current_amount)}
              </p>
              {repaidRatio != null ? (
                <div className="mt-4 text-left">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-400">Погашено</span>
                    <span className="font-semibold text-slate-700">
                      {Math.round(repaidRatio * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-rose-100">
                    <div
                      className="h-full rounded-full bg-rose-400/80 transition-all"
                      style={{ width: `${repaidRatio * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </FadeIn>

        <FadeIn index={2}>
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-slate-100 p-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Платёж
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                {payment && payment.amount > 0
                  ? formatRub(payment.amount)
                  : '—'}
              </p>
            </Card>
            <Card className="border-slate-100 p-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Осталось
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                {monthsLeft != null ? `${monthsLeft} мес.` : '—'}
              </p>
              {contractMonthsLeft != null &&
              payoffMonthsLeft != null &&
              contractMonthsLeft !== payoffMonthsLeft ? (
                <p className="mt-0.5 text-[10px] text-slate-400">
                  по договору {contractMonthsLeft} мес.
                </p>
              ) : null}
            </Card>
            <Card className="border-slate-100 p-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Погашено
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                {formatRub(repaid)}
              </p>
            </Card>
          </div>
        </FadeIn>

        {payment?.expense ? (
          <FadeIn index={3}>
            <Link to="/settings/expenses">
              <Card className="flex items-center justify-between border-slate-100 px-4 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    В обязательных расходах
                  </p>
                  <p className="text-xs text-slate-400">
                    {payment.dueDay != null
                      ? `${payment.dueDay}-е число · ${formatRub(payment.amount)}`
                      : formatRub(payment.amount)}
                  </p>
                </div>
                <span className="text-sm font-medium text-blue-600">Открыть</span>
              </Card>
            </Link>
          </FadeIn>
        ) : null}

        {plan.length > 0 ? (
          <FadeIn index={4}>
            <div>
              <h2 className="mb-2 font-bold text-slate-900">План закрытия</h2>
              <Card className="divide-y divide-slate-100 border-slate-100 p-0 shadow-sm">
                {plan.map((step) => (
                  <div
                    key={step.date.toISOString()}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {step.date.getDate()} {MONTHS_SHORT[step.date.getMonth()]}
                      </p>
                      <p className="text-xs text-slate-400">
                        {withInterest && step.interest > 0
                          ? `проц. ${formatRub(step.interest)} · тело ${formatRub(step.principal)} · остаток ${formatRub(step.balanceAfter)}`
                          : `остаток ${formatRub(step.balanceAfter)}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-rose-700/80">
                      −{formatRub(step.payment)}
                    </p>
                  </div>
                ))}
              </Card>
              {monthsLeft != null && monthsLeft > plan.length ? (
                <p className="mt-2 text-center text-xs text-slate-400">
                  ещё ≈ {monthsLeft - plan.length} мес.
                  {totalMonths != null ? ` · всего ~${totalMonths}` : ''}
                </p>
              ) : null}
            </div>
          </FadeIn>
        ) : null}

        <FadeIn index={5}>
          <Button className="w-full" size="lg" onClick={() => setPayOpen(true)}>
            Погасить
          </Button>
        </FadeIn>

        <FadeIn index={6}>
          <div>
            <h2 className="mb-2 font-bold text-slate-900">История погашений</h2>
            <div className="space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-slate-400">Пока нет погашений</p>
              ) : (
                history.map((tx) => (
                  <Card
                    key={tx.id}
                    className="flex items-center justify-between border-slate-100 px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {tx.note ?? 'Погашение'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-rose-700/80">
                      {tx.amount_delta < 0
                        ? `−${formatRub(Math.abs(tx.amount_delta))}`
                        : formatRub(tx.amount_delta)}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </div>
        </FadeIn>
      </main>

      <Sheet open={payOpen} onOpenChange={setPayOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Досрочное погашение</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div>
              <Label>Сумма, ₽</Label>
              <Input
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            {withInterest ? (
              <div>
                <Label>Что изменить</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        id: 'reduce_term' as const,
                        title: 'Сократить срок',
                        hint: 'Платёж тот же',
                      },
                      {
                        id: 'reduce_payment' as const,
                        title: 'Снизить платёж',
                        hint: 'Срок тот же',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPayMode(opt.id)}
                      className={
                        payMode === opt.id
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
            {payPreview ? (
              <div className="rounded-2xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                {payPreview.accrued > 0 ? (
                  <p>
                    В проценты{' '}
                    {payPreview.accrued.toLocaleString('ru-RU', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ₽ · в тело{' '}
                    {payPreview.toPrincipal.toLocaleString('ru-RU', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ₽
                  </p>
                ) : null}
                <p className="font-semibold text-slate-900">
                  {payMode === 'reduce_payment'
                    ? `Новый платёж ≈ ${payPreview.newPayment.toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} ₽`
                    : payPreview.currentPayoffMonths != null &&
                        payPreview.newMonthsLeft != null
                      ? `Срок: ${payPreview.currentPayoffMonths} → ${payPreview.newMonthsLeft} мес.`
                      : `Останется ≈ ${payPreview.newMonthsLeft ?? '—'} мес.`}
                </p>
                {payMode === 'reduce_term' &&
                payPreview.contractMonthsLeft != null ? (
                  <p className="mt-1 text-xs text-slate-400">
                    по договору останется {payPreview.contractMonthsLeft} мес.
                  </p>
                ) : null}
              </div>
            ) : null}
          </SheetBody>
          <SheetFooter>
            <Button className="w-full" onClick={() => void repay()}>
              Погасить
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
              <Label>Название</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Описание</Label>
              <Input
                value={editPurpose}
                onChange={(e) => setEditPurpose(e.target.value)}
              />
            </div>
            <div>
              <Label>Исходный долг, ₽</Label>
              <Input
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ставка, %</Label>
                <Input
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  inputMode="decimal"
                  placeholder="пусто = долг"
                />
              </div>
              <div>
                <Label>Срок, мес</Label>
                <Input
                  value={editTerm}
                  onChange={(e) => setEditTerm(e.target.value)}
                  inputMode="numeric"
                  placeholder="60"
                />
              </div>
            </div>
            {editRate.trim() && numeric(editRate) > 0 ? (
              <div>
                <Label>Дата выдачи</Label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  По дате выдачи и сроку считаем, сколько платежей осталось
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Без ставки кредит считается простым долгом
              </p>
            )}
            <AssetStylePicker
              icon={editStyle.icon}
              bgColor={editStyle.bgColor}
              iconColor={editStyle.iconColor}
              onIconChange={(icon) => setEditStyle((s) => ({ ...s, icon }))}
              onBgChange={(bgColor) => setEditStyle((s) => ({ ...s, bgColor }))}
              onIconColorChange={(iconColor) =>
                setEditStyle((s) => ({ ...s, iconColor }))
              }
            />
          </SheetBody>
          <SheetFooter>
            <Button className="w-full" onClick={() => void saveEdit()}>
              Сохранить
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}
