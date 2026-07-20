import { getDatabase } from '@/lib/db/client';
import type { DistributionRule } from '@/lib/types';

function mapRule(row: Record<string, unknown>): DistributionRule {
  return {
    id: row.id as number,
    name: row.name as string,
    rule_type: row.rule_type as DistributionRule['rule_type'],
    value: row.value as number,
    currency: row.currency as DistributionRule['currency'],
    target_asset_id: row.target_asset_id as number | null,
    sort_order: row.sort_order as number,
  };
}

export async function getAllRules(): Promise<DistributionRule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM distribution_rules ORDER BY sort_order ASC, id ASC',
  );
  return rows.map(mapRule);
}

export async function createRule(input: Omit<DistributionRule, 'id'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO distribution_rules (name, rule_type, value, currency, target_asset_id, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.rule_type,
      input.value,
      input.currency,
      input.target_asset_id,
      input.sort_order,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateRule(id: number, input: Omit<DistributionRule, 'id'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE distribution_rules
     SET name = ?, rule_type = ?, value = ?, currency = ?, target_asset_id = ?, sort_order = ?
     WHERE id = ?`,
    [
      input.name,
      input.rule_type,
      input.value,
      input.currency,
      input.target_asset_id,
      input.sort_order,
      id,
    ],
  );
}

export async function deleteRule(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM distribution_rules WHERE id = ?', [id]);
}

export async function getRuleById(id: number): Promise<DistributionRule | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM distribution_rules WHERE id = ?',
    [id],
  );
  return row ? mapRule(row) : null;
}
