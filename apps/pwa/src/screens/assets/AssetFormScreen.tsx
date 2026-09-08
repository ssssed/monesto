import {
  Button,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@monesto/rune';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { AssetStylePicker } from '@/components/assets/AssetStylePicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import * as db from '@/lib/db';
import {
  contractualAnnuityPayment,
  creditRemainingMonthsFromSchedule,
  isExistingCreditLoan,
} from '@/lib/credit/plan';
import type { AssetIconName } from '@/lib/providers/assetIcons';
import {
  ASSET_PROVIDERS,
  CREDIT_DEFAULTS,
  getEnabledProviders,
} from '@/lib/providers/assetProviders';
import type { Asset } from '@/lib/types';
import { assetSlug } from '@/lib/utils/slug';
import { defaults, formScroll, formShell, numeric } from '@/screens/shared';

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
  const [goalDeadline, setGoalDeadline] = useState(asset?.goal_deadline ?? '');
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
        goal_deadline: isCredit ? null : goalDeadline.trim() || null,
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
      goal_deadline: isCredit ? null : goalDeadline.trim() || null,
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
            <div className="space-y-3">
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
              {!isCredit ? (
                <div>
                  <Label>Дедлайн цели</Label>
                  <DatePicker
                    placeholder="дд.мм.гггг"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Покажем, сколько откладывать с каждой зарплаты
                  </p>
                </div>
              ) : null}
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