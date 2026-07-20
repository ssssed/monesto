import { getDatabase } from '@/lib/db/client';
import type { Expense, MoneyFlowEntry } from '@/lib/types';

function mapExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as number,
    name: row.name as string,
    amount: row.amount as number,
    recurrence: row.recurrence as Expense['recurrence'],
    due_day: row.due_day as number | null,
    specific_date: row.specific_date as string | null,
  };
}

export async function getAllExpenses(): Promise<Expense[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM expenses ORDER BY id ASC',
  );
  return rows.map(mapExpense);
}

export async function replaceAllExpenses(entries: MoneyFlowEntry[]): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM expenses');

  for (const entry of entries) {
    await db.runAsync(
      `INSERT INTO expenses (name, amount, recurrence, due_day, specific_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        entry.name,
        Number(entry.amount),
        entry.isOneTime ? 'one_time' : 'monthly',
        entry.dueDay ? Number(entry.dueDay) : null,
        entry.specificDate ?? null,
      ],
    );
  }
}
