import { describe, expect, it } from 'vitest';

import {
  EXPENSE_TEMPLATES,
  expenseTemplateToEntry,
  mergeExpenseTemplates,
} from './templates';

describe('expense templates', () => {
  it('builds entry from template', () => {
    const entry = expenseTemplateToEntry(EXPENSE_TEMPLATES[0]!);
    expect(entry.name).toBe('Аренда / ипотека');
    expect(entry.amount).toBe('35000');
    expect(entry.dueDay).toBe('5');
  });

  it('merges without duplicating names', () => {
    const first = mergeExpenseTemplates([], [EXPENSE_TEMPLATES[0]!]);
    const second = mergeExpenseTemplates(first, [
      EXPENSE_TEMPLATES[0]!,
      EXPENSE_TEMPLATES[1]!,
    ]);
    expect(second).toHaveLength(2);
    expect(second.map((e) => e.name)).toEqual([
      'Аренда / ипотека',
      'Коммуналка',
    ]);
  });
});
