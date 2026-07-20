import { getDatabase } from '@/lib/db/client';

export async function isAllocationConfirmed(
  ruleId: number,
  cycleKey: string,
): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM allocation_confirmations WHERE rule_id = ? AND cycle_key = ?',
    [ruleId, cycleKey],
  );
  return Boolean(row);
}

export async function getConfirmedRuleIds(cycleKey: string): Promise<number[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ rule_id: number }>(
    'SELECT rule_id FROM allocation_confirmations WHERE cycle_key = ?',
    [cycleKey],
  );
  return rows.map((row) => row.rule_id);
}

export async function confirmAllocation(input: {
  ruleId: number;
  cycleKey: string;
  amountRub: number;
}): Promise<'ok' | 'already_confirmed'> {
  const db = await getDatabase();
  const existing = await isAllocationConfirmed(input.ruleId, input.cycleKey);
  if (existing) return 'already_confirmed';

  try {
    await db.runAsync(
      `INSERT INTO allocation_confirmations (rule_id, cycle_key, confirmed_at, amount_rub)
       VALUES (?, ?, ?, ?)`,
      [input.ruleId, input.cycleKey, new Date().toISOString(), input.amountRub],
    );
    return 'ok';
  } catch {
    return 'already_confirmed';
  }
}
