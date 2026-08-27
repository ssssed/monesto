import type { Asset, AssetTransaction } from '@/lib/types';
import { formatRub } from '@/lib/utils/format';

export type YearSummaryTone = 'growth' | 'stable' | 'decline';

/** Порог в ₽: меньше — считаем нейтральным. */
export const YEAR_SUMMARY_DELTA_EPS = 100;

export interface YearSummaryAssetRow {
  id: number;
  name: string;
  provider: Asset['provider'];
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
  headline: string;
  message: string;
  bannerHint: string;
  closingTitle: string;
  closingMessage: string;
}

function toRub(asset: Asset, amount: number, usdRubRate: number): number {
  if (asset.provider === 'usd') return amount * usdRubRate;
  return amount;
}

function balanceAt(
  asset: Asset,
  transactions: AssetTransaction[],
  at: Date,
): number {
  const after = transactions
    .filter(
      (tx) =>
        tx.asset_id === asset.id && new Date(tx.created_at).getTime() > at.getTime(),
    )
    .reduce((sum, tx) => sum + tx.amount_delta, 0);
  return Math.max(0, asset.current_amount - after);
}

function earliestAssetTx(
  assetId: number,
  transactions: AssetTransaction[],
): AssetTransaction | null {
  let earliest: AssetTransaction | null = null;
  for (const tx of transactions) {
    if (tx.asset_id !== assetId) continue;
    if (
      !earliest ||
      new Date(tx.created_at).getTime() < new Date(earliest.created_at).getTime()
    ) {
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
  asset: Asset,
  transactions: AssetTransaction[],
  yearStart: Date,
): number {
  const first = earliestAssetTx(asset.id, transactions);
  if (first && new Date(first.created_at).getTime() > yearStart.getTime()) {
    return balanceAt(asset, transactions, new Date(first.created_at));
  }
  return balanceAt(asset, transactions, yearStart);
}

export function resolveYearSummaryTone(deltaRub: number): YearSummaryTone {
  if (deltaRub > YEAR_SUMMARY_DELTA_EPS) return 'growth';
  if (deltaRub < -YEAR_SUMMARY_DELTA_EPS) return 'decline';
  return 'stable';
}

export function yearSummaryCopy(
  tone: YearSummaryTone,
  deltaRub: number,
  deltaPercent: number | null,
): Pick<
  YearSummary,
  'headline' | 'message' | 'bannerHint' | 'closingTitle' | 'closingMessage'
> {
  const abs = formatRub(Math.abs(deltaRub));

  if (tone === 'growth') {
    const pctHint =
      deltaPercent != null && deltaPercent > 0
        ? `+${deltaPercent.toFixed(0)}% за год`
        : `+${abs} за год`;
    return {
      headline: 'Вы большой молодец',
      message:
        deltaPercent != null && Math.abs(deltaPercent) < 5
          ? `Даже если разница почти незаметна — она есть: +${abs}. Большое дело складывается из маленьких шагов, и вы уже их делаете.`
          : `Ваши накопления выросли на ${abs}. Вы большой молодец: большая разница начинается с маленьких шагов, и вы уже на этом пути.`,
      bannerHint: pctHint,
      closingTitle: 'Так держать — маленькими шагами',
      closingMessage:
        'Продолжайте в том же духе: следующий цикл уже ждёт на главной.',
    };
  }

  if (tone === 'decline') {
    const pct =
      deltaPercent != null ? `${Math.abs(deltaPercent).toFixed(0)}%` : null;
    return {
      headline: 'Мы рядом',
      message: pct
        ? `По всем активам стало меньше на ${abs} (${pct}). Это бывает — и это не провал. Вы всё ещё смотрите на свои деньги прямо, а значит остаётесь в игре.`
        : `По всем активам стало меньше на ${abs}. Это бывает — и это не провал. Вы всё ещё смотрите на свои деньги прямо, а значит остаётесь в игре.`,
      bannerHint: pct ? `−${pct} · поддержка рядом` : 'Поддержка в итогах года',
      closingTitle: 'Следующий год начинается с ясной картины',
      closingMessage:
        'Вернитесь к циклу — вы уже ведёте учёт, а это важная опора.',
    };
  }

  return {
    headline: 'Вам нравится стабильность',
    message:
      'За год сумма почти не изменилась — видимо, вы цените спокойствие и предсказуемость. Самое время мягко сдвинуться: начать учитывать доходы и расходы и откладывать хотя бы чуть-чуть.',
    bannerHint: 'Стабильный год · можно шагнуть дальше',
    closingTitle: 'Стабильность — хорошая база',
    closingMessage:
      'Откройте цикл на главной и начните замечать, куда уходят деньги.',
  };
}

export function computeYearSummary(input: {
  assets: Asset[];
  transactions: AssetTransaction[];
  usdRubRate: number;
  now?: Date;
}): YearSummary {
  const now = input.now ?? new Date();
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
  const savings = input.assets.filter((a) => a.provider !== 'credit');
  const rate = input.usdRubRate > 0 ? input.usdRubRate : 82;

  let totalNowRub = 0;
  let totalAtYearStartRub = 0;
  let netDepositsRub = 0;
  const rows: YearSummaryAssetRow[] = [];

  for (const asset of savings) {
    const nowNative = asset.current_amount;
    const startNative = yearBaselineBalance(asset, input.transactions, yearStart);
    const nowRub = toRub(asset, nowNative, rate);
    const startRub = toRub(asset, startNative, rate);
    const deltaRub = nowRub - startRub;
    const deltaPercent =
      startRub > 0 ? (deltaRub / startRub) * 100 : nowRub > 0 ? 100 : null;

    totalNowRub += nowRub;
    totalAtYearStartRub += startRub;

    const first = earliestAssetTx(asset.id, input.transactions);
    const openedDuringYear =
      first != null && new Date(first.created_at).getTime() > yearStart.getTime();
    const ytdNative = input.transactions
      .filter((tx) => {
        if (tx.asset_id !== asset.id) return false;
        const t = new Date(tx.created_at).getTime();
        if (openedDuringYear && first) {
          return t > new Date(first.created_at).getTime();
        }
        return t >= yearStart.getTime();
      })
      .reduce((sum, tx) => sum + tx.amount_delta, 0);
    netDepositsRub += toRub(asset, ytdNative, rate);

    rows.push({
      id: asset.id,
      name: asset.name,
      provider: asset.provider,
      icon: asset.icon,
      bgColor: asset.bg_color,
      iconColor: asset.icon_color,
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
  const copy = yearSummaryCopy(tone, deltaRub, deltaPercent);

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
    ...copy,
  };
}
