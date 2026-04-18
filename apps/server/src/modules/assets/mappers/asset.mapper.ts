export type AssetJsonBase = {
  id: string;
  name: string;
  slug: string;
  symbol: string;
  price: number;
  icon: {
    name: string;
    backgroundColor: string;
    color: string;
  };
};

export type AssetJson =
  | (AssetJsonBase & { type: 'base' })
  | (AssetJsonBase & { type: 'priced'; priceChange: number; count: number });

export type HistoryJson = {
  id: string;
  type: 'buy' | 'sell';
  date: string;
  price: number;
  unit: string;
  count: number;
};

export type TxTotalsInput = {
  type: 'BUY' | 'SELL';
  price: number;
  count: number;
};

/** Сумма в деньгах (symbol): BUY += price×count, SELL −= price×count. Для PRICED ещё чистое количество. */
export function computeTotalsFromTransactions(
  txs: TxTotalsInput[],
  kind: 'BASE' | 'PRICED',
): { price: number; count: number | null } {
  let rub = 0;
  let netQty = 0;
  for (const t of txs) {
    const line = t.price * t.count;
    if (t.type === 'BUY') {
      rub += line;
      if (kind === 'PRICED') {
        netQty += t.count;
      }
    } else {
      rub -= line;
      if (kind === 'PRICED') {
        netQty -= t.count;
      }
    }
  }
  return {
    price: rub,
    count: kind === 'PRICED' ? netQty : null,
  };
}

export function computePriceChangePercent(
  txsOrderedDesc: { price: number }[],
): number {
  if (txsOrderedDesc.length < 2) return 0;
  const last = txsOrderedDesc[0].price;
  const prev = txsOrderedDesc[1].price;
  if (prev === 0) return last === 0 ? 0 : 100;
  return ((last - prev) / prev) * 100;
}

export type AssetRecord = {
  id: string;
  kind: 'BASE' | 'PRICED';
  name: string;
  slug: string;
  symbol: string;
  price: number;
  unit: string | null;
  count: number | null;
  icon: { name: string; backgroundColor: string; color: string };
  /** Две последние по времени — для `priceChange` (сравнение цен сделок). */
  transactions?: { price: number; occurredAt: Date }[];
};

export function mapAssetToJson(
  asset: AssetRecord,
  totals?: { price: number; count: number | null },
): AssetJson {
  const icon = {
    name: asset.icon.name,
    backgroundColor: asset.icon.backgroundColor,
    color: asset.icon.color,
  };
  const priceVal = totals?.price ?? asset.price;
  const countVal =
    totals?.count !== undefined && totals.count !== null
      ? totals.count
      : asset.count;
  const base: AssetJsonBase = {
    id: asset.id,
    name: asset.name,
    slug: asset.slug,
    symbol: asset.symbol,
    price: priceVal,
    icon,
  };
  if (asset.kind === 'PRICED') {
    return {
      ...base,
      type: 'priced',
      count: Number(countVal ?? 0),
      priceChange: computePriceChangePercent(asset.transactions ?? []),
    };
  }
  return { ...base, type: 'base' };
}

export type TransactionRecord = {
  id: string;
  type: 'BUY' | 'SELL';
  occurredAt: Date;
  price: number;
  unit: string;
  count: number;
};

export function mapTransactionToHistoryJson(tx: TransactionRecord): HistoryJson {
  return {
    id: tx.id,
    type: tx.type === 'BUY' ? 'buy' : 'sell',
    date: tx.occurredAt.toISOString(),
    price: tx.price,
    unit: tx.unit,
    count: tx.count,
  };
}
