import { FinanceType } from '@prisma/client';

export type FinanceRecordAmount = {
  type: FinanceType;
  name: string | null;
  amount: number;
};

export function isDetailedRecord(name: string | null): boolean {
  return name != null && name.trim() !== '';
}

/**
 * Суммирует записи одного типа без двойного учёта:
 * если есть детализированные строки (name задан) — берём только их;
 * иначе — только общие записи (name = null).
 */
export function sumFinanceRecordsByType(
  records: FinanceRecordAmount[],
  type: FinanceType,
): number {
  const ofType = records.filter((record) => record.type === type);
  if (ofType.length === 0) {
    return 0;
  }

  const detailed = ofType.filter((record) => isDetailedRecord(record.name));
  const source =
    detailed.length > 0
      ? detailed
      : ofType.filter((record) => !isDetailedRecord(record.name));

  return source.reduce((sum, record) => sum + record.amount, 0);
}

/**
 * Чистый доход за месяц: income − expense с учётом детализации.
 */
export function calculateNetIncome(records: FinanceRecordAmount[]): number {
  const income = sumFinanceRecordsByType(records, FinanceType.income);
  const expense = sumFinanceRecordsByType(records, FinanceType.expense);
  return Math.max(0, income - expense);
}
