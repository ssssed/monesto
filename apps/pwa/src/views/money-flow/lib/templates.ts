import type { MoneyFlowEntry } from '@/kernel/types';
import { createEmptyExpenseEntry } from '@/entities/report';

export interface ExpenseTemplate {
  id: string;
  name: string;
  amountHint: number;
  dueDay: number;
}

export const EXPENSE_TEMPLATES: readonly ExpenseTemplate[] = [
  { id: 'rent', name: 'Аренда / ипотека', amountHint: 35_000, dueDay: 5 },
  { id: 'utilities', name: 'Коммуналка', amountHint: 6_000, dueDay: 10 },
  { id: 'mobile', name: 'Связь и интернет', amountHint: 1_200, dueDay: 15 },
  { id: 'transport', name: 'Проезд / бензин', amountHint: 4_000, dueDay: 1 },
  { id: 'subscriptions', name: 'Подписки', amountHint: 990, dueDay: 20 },
  { id: 'food', name: 'Продукты', amountHint: 18_000, dueDay: 1 },
] as const;

export function expenseTemplateToEntry(template: ExpenseTemplate): MoneyFlowEntry {
  const entry = createEmptyExpenseEntry();
  return {
    ...entry,
    name: template.name,
    amount: String(template.amountHint),
    dueDay: String(template.dueDay),
    isOneTime: false,
  };
}

export function mergeExpenseTemplates(
  current: MoneyFlowEntry[],
  templates: ExpenseTemplate[],
): MoneyFlowEntry[] {
  const existingNames = new Set(
    current.map((e) => e.name.trim().toLowerCase()).filter(Boolean),
  );
  const added = templates
    .filter((t) => !existingNames.has(t.name.trim().toLowerCase()))
    .map(expenseTemplateToEntry);

  const cleaned = current.filter(
    (e) => e.name.trim() || e.amount.trim() || e.dueDay?.trim(),
  );
  return [...cleaned, ...added];
}
