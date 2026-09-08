import { Card } from '@monesto/rune';
import { Link } from '@tanstack/react-router';
import { ArrowUpDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { AssetReorderHandle } from '@/components/assets/AssetReorderHandle';
import { PageTitle } from '@/components/layout/PageHeader';
import { FadeIn } from '@/components/ui/FadeIn';
import { GoalProgressBadge, TrendBadge } from '@/components/ui/GoalProgressBadge';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { UndoToast } from '@/components/ui/UndoToast';
import * as db from '@/lib/db';
import { describeGoalPace } from '@/lib/goals/describePace';
import { calcUsdValuation } from '@/lib/exchange/usdValuation';
import { creditRepaidRatio } from '@/lib/credit/plan';
import type { Asset } from '@/lib/types';
import {
  formatRub,
  formatUsd,
} from '@/lib/utils/format';
import { assetSlug } from '@/lib/utils/slug';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';
import { shell, UNDO_MS } from '@/screens/shared';

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
          const goalPace = hasGoal
            ? describeGoalPace({
                currentAmount: a.current_amount,
                goalAmount: a.goal_amount as number,
                deadlineIso: a.goal_deadline,
              })
            : null;
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
                {goalPace?.detail ? (
                  <p className="mt-1 text-xs leading-snug text-slate-400">
                    {goalPace.detail}
                  </p>
                ) : null}
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