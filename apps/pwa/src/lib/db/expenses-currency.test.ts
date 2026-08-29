import { beforeEach, describe, expect, it, vi } from 'vitest';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

vi.stubGlobal('localStorage', createMemoryStorage());

const db = await import('./index');
const { expensesToEntries } = await import('../utils/format');
const { calculateReport } = await import('../report/calculateReport');

describe('USD expense persistence', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.clearAllData();
  });

  it('saves and reloads expense with currency usd', async () => {
    await db.replaceAllExpenses([
      {
        id: `${Date.now()}-new`,
        name: 'Подписка',
        currency: 'usd',
        amount: '15.5',
        isOneTime: false,
        dueDay: '10',
      },
    ]);

    const expenses = await db.getAllExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.name).toBe('Подписка');
    expect(expenses[0]?.currency).toBe('usd');
    expect(expenses[0]?.amount).toBe(15.5);
    expect(expenses[0]?.due_day).toBe(10);

    const entries = expensesToEntries(expenses);
    expect(entries[0]?.currency).toBe('usd');
    expect(entries[0]?.amount).toBe('15.5');
  });

  it('report converts usd expense to rub', async () => {
    await db.replaceAllIncomes([
      {
        name: 'Зарплата',
        currency: 'rub',
        amount: '100000',
        isOneTime: false,
        isBimonthlySalary: false,
        paymentDay: '25',
        isPrimary: true,
        primaryPaymentDay: 25,
      },
    ]);
    await db.replaceAllExpenses([
      {
        name: 'Подписка',
        currency: 'usd',
        amount: '10',
        isOneTime: false,
        dueDay: '20',
      },
    ]);

    const incomes = await db.getAllIncomes();
    const expenses = await db.getAllExpenses();
    const today = new Date(2026, 7, 28);
    const report = calculateReport({
      incomes,
      expenses,
      rules: [],
      assets: [],
      today,
      usdRubRate: 80,
    });
    expect('code' in report).toBe(false);
    if ('code' in report) return;
    expect(expenses[0]?.currency).toBe('usd');
    expect(report.totalExpenses).toBe(800);
  });

  it('append usd expense without dropping existing rows', async () => {
    await db.replaceAllExpenses([
      {
        id: '1',
        name: 'Аренда',
        currency: 'rub',
        amount: '50000',
        isOneTime: false,
        dueDay: '1',
      },
    ]);

    await db.replaceAllExpenses([
      {
        id: '1',
        name: 'Аренда',
        currency: 'rub',
        amount: '50000',
        isOneTime: false,
        dueDay: '1',
      },
      {
        id: `${Date.now()}-x`,
        name: 'Подписка',
        currency: 'usd',
        amount: '10',
        isOneTime: false,
        dueDay: '5',
      },
    ]);

    const expenses = await db.getAllExpenses();
    expect(expenses).toHaveLength(2);
    expect(expenses.find((e) => e.name === 'Подписка')?.currency).toBe('usd');
  });
});
