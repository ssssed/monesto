import { getDatabase } from '@/lib/db/client';
import type { Asset, AssetProvider, AssetTransaction } from '@/lib/types';

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: row.id as number,
    name: row.name as string,
    provider: row.provider as AssetProvider,
    purpose: row.purpose as string | null,
    goal_amount: row.goal_amount as number | null,
    current_amount: row.current_amount as number,
    steam_inventory_url: row.steam_inventory_url as string | null,
    icon: (row.icon as string) ?? 'wallet-outline',
    bg_color: (row.bg_color as string) ?? '#DBEAFE',
    icon_color: (row.icon_color as string) ?? '#2563EB',
    cost_basis_rub: (row.cost_basis_rub as number) ?? 0,
  };
}

function mapTransaction(row: Record<string, unknown>): AssetTransaction {
  return {
    id: row.id as number,
    asset_id: row.asset_id as number,
    amount_delta: row.amount_delta as number,
    note: row.note as string | null,
    created_at: row.created_at as string,
    cost_rub: (row.cost_rub as number | null) ?? null,
  };
}

export async function getAllAssets(): Promise<Asset[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM assets ORDER BY id ASC',
  );
  return rows.map(mapAsset);
}

export async function getAssetById(id: number): Promise<Asset | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM assets WHERE id = ?',
    [id],
  );
  return row ? mapAsset(row) : null;
}

export async function createAsset(input: {
  name: string;
  provider: AssetProvider;
  purpose?: string;
  goal_amount?: number;
  current_amount: number;
  icon?: string;
  bg_color?: string;
  icon_color?: string;
  /** Для USD: сколько ₽ потратили на начальный баланс */
  cost_basis_rub?: number;
}): Promise<number> {
  const db = await getDatabase();
  const costBasis =
    input.cost_basis_rub ??
    (input.provider === 'rub' ? input.current_amount : 0);

  const result = await db.runAsync(
    `INSERT INTO assets
      (name, provider, purpose, goal_amount, current_amount, icon, bg_color, icon_color, cost_basis_rub)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.provider,
      input.purpose ?? null,
      input.goal_amount ?? null,
      input.current_amount,
      input.icon ?? 'wallet-outline',
      input.bg_color ?? '#DBEAFE',
      input.icon_color ?? '#2563EB',
      costBasis,
    ],
  );

  const assetId = result.lastInsertRowId;
  if (input.current_amount !== 0) {
    await db.runAsync(
      `INSERT INTO asset_transactions (asset_id, amount_delta, note, created_at, cost_rub)
       VALUES (?, ?, ?, ?, ?)`,
      [
        assetId,
        input.current_amount,
        'Начальный баланс',
        new Date().toISOString(),
        costBasis || null,
      ],
    );
  }

  return assetId;
}

export async function updateAsset(
  id: number,
  input: {
    name?: string;
    purpose?: string | null;
    goal_amount?: number | null;
    icon?: string;
    bg_color?: string;
    icon_color?: string;
  },
): Promise<void> {
  const db = await getDatabase();
  const asset = await getAssetById(id);
  if (!asset) return;

  await db.runAsync(
    `UPDATE assets
     SET name = ?, purpose = ?, goal_amount = ?, icon = ?, bg_color = ?, icon_color = ?
     WHERE id = ?`,
    [
      input.name ?? asset.name,
      input.purpose !== undefined ? input.purpose : asset.purpose,
      input.goal_amount !== undefined ? input.goal_amount : asset.goal_amount,
      input.icon ?? asset.icon,
      input.bg_color ?? asset.bg_color,
      input.icon_color ?? asset.icon_color,
      id,
    ],
  );
}

/**
 * Пополнить/списать.
 * @param costRubDelta — изменение cost_basis в ₽ (для USD покупок/продаж)
 */
export async function addTransaction(
  assetId: number,
  amountDelta: number,
  note?: string,
  costRubDelta?: number,
): Promise<void> {
  const db = await getDatabase();
  const asset = await getAssetById(assetId);
  if (!asset) return;

  let costDelta = costRubDelta ?? 0;
  if (costRubDelta == null) {
    if (asset.provider === 'rub') {
      costDelta = amountDelta;
    } else if (asset.provider === 'usd' && amountDelta < 0 && asset.current_amount > 0) {
      // пропорциональное списание cost basis
      const avg = asset.cost_basis_rub / asset.current_amount;
      costDelta = avg * amountDelta; // negative
    }
  }

  await db.runAsync(
    `INSERT INTO asset_transactions (asset_id, amount_delta, note, created_at, cost_rub)
     VALUES (?, ?, ?, ?, ?)`,
    [assetId, amountDelta, note ?? null, new Date().toISOString(), costDelta || null],
  );

  await db.runAsync(
    `UPDATE assets
     SET current_amount = current_amount + ?,
         cost_basis_rub = MAX(0, cost_basis_rub + ?)
     WHERE id = ?`,
    [amountDelta, costDelta, assetId],
  );
}

/** Пополнение из распределения (сумма в ₽). Для USD конвертирует по курсу. */
export async function depositFromAllocation(
  assetId: number,
  amountRub: number,
  usdRubRate: number,
  note: string,
): Promise<void> {
  const asset = await getAssetById(assetId);
  if (!asset) return;

  if (asset.provider === 'usd') {
    const usdAmount = amountRub / usdRubRate;
    await addTransaction(assetId, usdAmount, note, amountRub);
  } else {
    await addTransaction(assetId, amountRub, note, amountRub);
  }
}

export async function setAssetAmount(
  assetId: number,
  newAmount: number,
  note?: string,
): Promise<void> {
  const asset = await getAssetById(assetId);
  if (!asset) return;
  const delta = newAmount - asset.current_amount;
  if (delta === 0) return;
  await addTransaction(assetId, delta, note ?? 'Изменение баланса');
}

export async function getTransactions(assetId: number): Promise<AssetTransaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM asset_transactions WHERE asset_id = ? ORDER BY created_at DESC',
    [assetId],
  );
  return rows.map(mapTransaction);
}

export async function getAssetTrend(assetId: number): Promise<'up' | 'down' | 'flat'> {
  const db = await getDatabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount_delta), 0) as total
     FROM asset_transactions
     WHERE asset_id = ? AND created_at >= ?`,
    [assetId, cutoff.toISOString()],
  );

  const delta = row?.total ?? 0;
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

export function getTotalSpent(transactions: AssetTransaction[]): number {
  return transactions
    .filter((tx) => tx.amount_delta < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount_delta), 0);
}
