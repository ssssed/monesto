import { Button, Card } from '@monesto/rune';
import { Link, useRouterState } from '@tanstack/react-router';
import { GitBranch, Plus, Wallet } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AssetAvatar } from '@/entities/asset';
import { PageHeader, PageTitle } from '@/shared/ui/page-header';
import { SwipeToDelete } from '@/shared/ui/swipe-to-delete';
import { UndoToast } from '@/shared/ui/undo-toast';
import * as db from '@/kernel/db';
import { calculateReport, isReportError } from '@/entities/report';
import { ROUTES } from '@/shared/config/routes';
import {
  summarizeRulesBudget,
} from '@/entities/report';
import type {
  Asset,
  DistributionRule,
} from '@/kernel/types';
import { formatRub } from '@/shared/lib/format';
import { useExchangeRateStore } from '@/entities/exchange';
import { shell, UNDO_MS } from '@/shared/lib/layout';

export function Rules() {
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
    if (pathname === ROUTES.settings.rules.index || pathname === `${ROUTES.settings.rules.index}/`) {
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

      <PageHeader title="Правила" backTo={ROUTES.settings.index} />
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
        <Link to={ROUTES.settings.rules.new} className="block">
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
            <Link to={ROUTES.assets.new} search={{ from: 'rules' }} className="block">
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
                to={ROUTES.settings.rules.detail}
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