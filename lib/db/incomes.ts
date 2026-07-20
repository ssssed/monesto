import { getDatabase } from '@/lib/db/client';
import type { IncomeSource, MoneyFlowEntry } from '@/lib/types';

function mapIncome(row: Record<string, unknown>): IncomeSource {
  return {
    id: row.id as number,
    name: row.name as string,
    income_kind: row.income_kind as IncomeSource['income_kind'],
    amount: row.amount as number | null,
    monthly_amount: row.monthly_amount as number | null,
    is_one_time: Boolean(row.is_one_time),
    recurrence: row.recurrence as IncomeSource['recurrence'],
    payment_day: row.payment_day as number | null,
    is_primary: Boolean(row.is_primary),
    primary_payment_day: row.primary_payment_day as IncomeSource['primary_payment_day'],
    specific_date: row.specific_date as string | null,
  };
}

export async function getAllIncomes(): Promise<IncomeSource[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM income_sources ORDER BY id ASC',
  );
  return rows.map(mapIncome);
}

export async function replaceAllIncomes(entries: MoneyFlowEntry[]): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM income_sources');

  for (const entry of entries) {
    const isBimonthly = Boolean(entry.isBimonthlySalary);
    await db.runAsync(
      `INSERT INTO income_sources
        (name, income_kind, amount, monthly_amount, is_one_time, recurrence, payment_day, is_primary, primary_payment_day, specific_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.name,
        isBimonthly ? 'bimonthly_salary' : 'fixed',
        isBimonthly ? null : Number(entry.amount),
        isBimonthly ? Number(entry.monthlyAmount ?? entry.amount) : null,
        entry.isOneTime ? 1 : 0,
        entry.isOneTime ? 'one_time' : 'monthly',
        entry.paymentDay ? Number(entry.paymentDay) : null,
        entry.isPrimary ? 1 : 0,
        entry.primaryPaymentDay ?? (isBimonthly ? 25 : null),
        entry.specificDate ?? null,
      ],
    );
  }
}
