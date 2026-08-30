import { AssetProvider } from '@prisma/client';
import type { AssetCalc, AssetTransactionCalc } from './types';

export type YearSummaryTone = 'growth' | 'stable' | 'decline';

/** Порог в ₽: меньше — считаем нейтральным. */
export const YEAR_SUMMARY_DELTA_EPS = 100;

export interface YearSummaryAssetRow {
  id: number;
  name: string;
  provider: AssetProvider;
  icon: string;
  bgColor: string;
  iconColor: string;
  startRub: number;
  nowRub: number;
  deltaRub: number;
  deltaPercent: number | null;
  nativeNow: number;
}

export interface YearSummary {
  year: number;
  totalNowRub: number;
  totalAtYearStartRub: number;
  deltaRub: number;
  deltaPercent: number | null;
  netDepositsRub: number;
  savingsCount: number;
  usdRubRate: number;
  assets: YearSummaryAssetRow[];
  tone: YearSummaryTone;
}

function toRub(asset: AssetCalc, amount: number, usdRubRate: number): number {
  if (asset.provider === AssetProvider.usd) return amount * usdRubRate;
  return amount;
}

function balanceAt(
  asset: AssetCalc,
  transactions: AssetTransactionCalc[],
  at: Date,
): number {
  const after = transactions
    .filter(
      (tx) => tx.assetId === asset.id && tx.createdAt.getTime() > at.getTime(),
    )
    .reduce((sum, tx) => sum + tx.amountDelta, 0);
  return Math.max(0, asset.currentAmount - after);
}

function earliestAssetTx(
  assetId: number,
  transactions: AssetTransactionCalc[],
): AssetTransactionCalc | null {
  let earliest: AssetTransactionCalc | null = null;
  for (const tx of transactions) {
    if (tx.assetId !== assetId) continue;
    if (!earliest || tx.createdAt.getTime() < earliest.createdAt.getTime()) {
      earliest = tx;
    }
  }
  return earliest;
}

/**
 * База для итогов года:
 * — если актив уже был до 1 января — баланс на 1 января;
 * — если создан в течение года с начальной суммой — эта начальная сумма
 *   (а не ноль «до создания»).
 */
export function yearBaselineBalance(
  asset: AssetCalc,
  transactions: AssetTransactionCalc[],
  yearStart: Date,
): number {
  const first = earliestAssetTx(asset.id, transactions);
  if (first && first.createdAt.getTime() > yearStart.getTime()) {
    return balanceAt(asset, transactions, first.createdAt);
  }
  return balanceAt(asset, transactions, yearStart);
}

export function resolveYearSummaryTone(deltaRub: number): YearSummaryTone {
  if (deltaRub > YEAR_SUMMARY_DELTA_EPS) return 'growth';
  if (deltaRub < -YEAR_SUMMARY_DELTA_EPS) return 'decline';
  return 'stable';
}

export function computeYearSummary(input: {
  assets: AssetCalc[];
  transactions: AssetTransactionCalc[];
  usdRubRate: number;
  now: Date;
}): YearSummary {
  const now = input.now;
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
  const savings = input.assets.filter(
    (a) => a.provider !== AssetProvider.credit,
  );
  const rate = input.usdRubRate > 0 ? input.usdRubRate : 82;

  let totalNowRub = 0;
  let totalAtYearStartRub = 0;
  let netDepositsRub = 0;
  const rows: YearSummaryAssetRow[] = [];

  for (const asset of savings) {
    const nowNative = asset.currentAmount;
    const startNative = yearBaselineBalance(
      asset,
      input.transactions,
      yearStart,
    );
    const nowRub = toRub(asset, nowNative, rate);
    const startRub = toRub(asset, startNative, rate);
    const deltaRub = nowRub - startRub;
    const deltaPercent =
      startRub > 0 ? (deltaRub / startRub) * 100 : nowRub > 0 ? 100 : null;

    totalNowRub += nowRub;
    totalAtYearStartRub += startRub;

    const first = earliestAssetTx(asset.id, input.transactions);
    const openedDuringYear =
      first != null && first.createdAt.getTime() > yearStart.getTime();
    const ytdNative = input.transactions
      .filter((tx) => {
        if (tx.assetId !== asset.id) return false;
        const t = tx.createdAt.getTime();
        if (openedDuringYear && first) {
          return t > first.createdAt.getTime();
        }
        return t >= yearStart.getTime();
      })
      .reduce((sum, tx) => sum + tx.amountDelta, 0);
    netDepositsRub += toRub(asset, ytdNative, rate);

    rows.push({
      id: asset.id,
      name: asset.name,
      provider: asset.provider,
      icon: asset.icon,
      bgColor: asset.bgColor,
      iconColor: asset.iconColor,
      startRub,
      nowRub,
      deltaRub,
      deltaPercent,
      nativeNow: nowNative,
    });
  }

  rows.sort((a, b) => Math.abs(b.deltaRub) - Math.abs(a.deltaRub));

  const deltaRub = totalNowRub - totalAtYearStartRub;
  const deltaPercent =
    totalAtYearStartRub > 0
      ? (deltaRub / totalAtYearStartRub) * 100
      : totalNowRub > 0
        ? 100
        : null;

  const tone = resolveYearSummaryTone(deltaRub);

  return {
    year,
    totalNowRub,
    totalAtYearStartRub,
    deltaRub,
    deltaPercent,
    netDepositsRub,
    savingsCount: savings.length,
    usdRubRate: rate,
    assets: rows,
    tone,
  };
}
