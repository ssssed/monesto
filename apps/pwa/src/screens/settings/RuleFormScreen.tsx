import {
  Button,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger
} from '@monesto/rune';
import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { PageHeader, PageTitle } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import * as db from '@/lib/db';
import { calculateReport, isReportError } from '@/lib/report/calculateReport';
import {
  freeRulesPercent,
  summarizeDraftRulesBudget,
} from '@/lib/report/rulesBudget';
import type {
  Asset,
  DistributionRule,
  RuleType,
} from '@/lib/types';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';
import { formScroll, formShell, numeric } from '@/screens/shared';

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