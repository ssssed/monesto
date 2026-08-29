import { Button } from '@monesto/rune';
import { Link } from '@tanstack/react-router';
import { PartyPopper, Snowflake, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { FadeIn } from '@/components/ui/FadeIn';
import * as db from '@/lib/db';
import { assetSlug } from '@/lib/utils/slug';
import {
  computeYearSummary,
  type YearSummary,
  type YearSummaryAssetRow,
} from '@/lib/year-summary/computeYearSummary';
import { formatRub, formatUsd } from '@/lib/utils/format';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

const nestedShell = 'mx-auto w-full max-w-lg px-5 pt-6 pb-10';

function formatDelta(amount: number): string {
  if (amount > 0) return `+${formatRub(amount)}`;
  return formatRub(amount);
}

function formatDeltaPct(pct: number | null): string | null {
  if (pct == null) return null;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}%`;
}

function AssetYearRow({ row }: { row: YearSummaryAssetRow }) {
  const pct = formatDeltaPct(row.deltaPercent);
  const deltaClass =
    row.deltaRub > 100
      ? 'text-emerald-700'
      : row.deltaRub < -100
        ? 'text-rose-700'
        : 'text-slate-500';

  return (
    <Link
      to="/assets/$slug"
      params={{ slug: assetSlug({ id: row.id, name: row.name }) }}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-slate-50"
    >
      <AssetAvatar
        icon={row.icon}
        bgColor={row.bgColor}
        iconColor={row.iconColor}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-slate-900">
          {row.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {row.provider === 'usd'
            ? `${formatUsd(row.nativeNow)} · ${formatRub(row.nowRub)}`
            : formatRub(row.nowRub)}
          {row.startRub > 0 ? ` · было ${formatRub(row.startRub)}` : ' · новый'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold tabular-nums ${deltaClass}`}>
          {formatDelta(row.deltaRub)}
        </p>
        {pct ? (
          <p className={`mt-0.5 text-[11px] font-medium tabular-nums ${deltaClass}`}>
            {pct}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function YearSummaryScreen() {
  const rate = useExchangeRateStore((s) => s.usdRubRate) ?? 82;
  const [summary, setSummary] = useState<YearSummary | null>(null);

  useEffect(() => {
    void Promise.all([db.getAllAssets(), db.getAllAssetTransactions()]).then(
      ([assets, transactions]) => {
        setSummary(
          computeYearSummary({
            assets,
            transactions,
            usdRubRate: rate,
          }),
        );
      },
    );
  }, [rate]);

  if (!summary) {
    return <main className={nestedShell}>Считаем итоги…</main>;
  }

  const ToneIcon =
    summary.tone === 'decline'
      ? TrendingDown
      : summary.tone === 'growth'
        ? TrendingUp
        : PartyPopper;

  const deltaLabel = formatDelta(summary.deltaRub);
  const rateLabel = Math.round(summary.usdRubRate).toLocaleString('ru-RU');

  return (
    <main className={`${nestedShell} space-y-6`}>
      <PageHeader title={`Итоги ${summary.year}`} backTo="/" />

      <FadeIn variant="rise" durationClass="duration-700">
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#0b1220_0%,#14532d_42%,#7f1d1d_100%)] p-5 text-white shadow-lg ring-1 ring-white/10">
          <Snowflake
            className="pointer-events-none absolute right-4 top-4 h-16 w-16 text-white/10"
            strokeWidth={1.25}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">
            Новогодний отчёт
          </p>
          <h2 className="mt-2 max-w-[18rem] text-2xl font-bold tracking-tight">
            {summary.headline}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            {summary.message}
          </p>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-white/45">Изменение за год</p>
              <p
                className={`mt-1 text-3xl font-bold tracking-tight ${
                  summary.tone === 'decline'
                    ? 'text-rose-200'
                    : summary.tone === 'growth'
                      ? 'text-emerald-200'
                      : 'text-white'
                }`}
              >
                {deltaLabel}
              </p>
              {summary.deltaPercent != null ? (
                <p className="mt-1 text-sm text-white/55">
                  {summary.deltaPercent > 0 ? '+' : ''}
                  {summary.deltaPercent.toFixed(1)}% к началу года
                </p>
              ) : null}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-amber-200 ring-1 ring-white/15">
              <ToneIcon className="h-6 w-6" strokeWidth={1.85} />
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn index={1}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200/70 ring-1 ring-slate-200/80">
          <div className="bg-white px-4 py-4">
            <p className="text-[11px] font-medium text-slate-400">На старте</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
              {formatRub(summary.totalAtYearStartRub)}
            </p>
          </div>
          <div className="bg-white px-4 py-4">
            <p className="text-[11px] font-medium text-slate-400">Итого сейчас</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
              {formatRub(summary.totalNowRub)}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">
              в ₽ · курс $ {rateLabel}
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn index={2}>
        <section>
          <div className="mb-1 flex items-end justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">По активам</h3>
            <p className="text-[11px] text-slate-400">за {summary.year} год</p>
          </div>

          {summary.assets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-600">
                Пока нет накоплений
              </p>
              <p className="mx-auto mt-1 max-w-[240px] text-xs leading-snug text-slate-400">
                Создайте актив — в следующем отчёте здесь будет разбивка по
                каждому.
              </p>
              <Link to="/assets/new" className="mt-4 inline-block">
                <Button variant="secondary" size="sm">
                  Создать актив
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-2 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 divide-y divide-slate-100">
              {summary.assets.map((row) => (
                <AssetYearRow key={row.id} row={row} />
              ))}
            </div>
          )}
        </section>
      </FadeIn>

      <FadeIn index={3} variant="fade">
        <div className="rounded-2xl bg-slate-900 px-5 py-5 text-center text-white">
          <p className="text-[15px] font-semibold leading-snug">
            {summary.closingTitle}
          </p>
          <p className="mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-white/50">
            {summary.closingMessage}
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex text-sm font-semibold text-amber-200 transition-colors hover:text-amber-100"
          >
            На главную →
          </Link>
        </div>
      </FadeIn>
    </main>
  );
}
