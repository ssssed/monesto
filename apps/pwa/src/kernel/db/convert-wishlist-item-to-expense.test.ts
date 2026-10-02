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
const { calculateReport } = await import('@/entities/report');

describe('convertWishlistItemToExpense — regression: must land on its planned date', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.clearAllData();
    await db.replaceAllIncomes([
      {
        name: 'Зарплата',
        currency: 'rub',
        amount: '150000',
        isOneTime: false,
        isBimonthlySalary: false,
        paymentDay: '25',
        isPrimary: true,
        primaryPaymentDay: 25,
      },
    ]);
  });

  it('stores the expense with the exact date passed in, not today', async () => {
    const wishlistId = await db.createWishlistItem({
      name: 'Отпуск в Сочи',
      price: 40000,
      planned_date: '2026-12-20',
    });

    await db.convertWishlistItemToExpense(wishlistId, 40000, '2026-12-20');

    const expenses = await db.getAllExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.specific_date).toBe('2026-12-20');

    // Хотелка превращается в расход и уходит из вишлиста.
    const wishlistItems = await db.getAllWishlistItems();
    expect(wishlistItems).toHaveLength(0);
  });

  it('does not show up in the cycle current at the moment of spending', async () => {
    const wishlistId = await db.createWishlistItem({
      name: 'Отпуск в Сочи',
      price: 40000,
      planned_date: '2026-12-20',
    });
    await db.convertWishlistItemToExpense(wishlistId, 40000, '2026-12-20');
    const incomes = await db.getAllIncomes();
    const expenses = await db.getAllExpenses();

    // "Сегодня" в момент покупки — задолго до запланированной даты.
    const todayAtPurchaseTime = new Date(2026, 9, 2); // 2 октября
    const report = calculateReport({
      incomes,
      expenses,
      rules: [],
      assets: [],
      today: todayAtPurchaseTime,
    });
    expect('code' in report).toBe(false);
    if ('code' in report) return;

    expect(report.expenseLines.some((l) => l.name === 'Отпуск в Сочи')).toBe(false);
    expect(report.totalExpenses).toBe(0);
  });

  it('shows up once the cycle covering the planned date becomes current', async () => {
    const wishlistId = await db.createWishlistItem({
      name: 'Отпуск в Сочи',
      price: 40000,
      planned_date: '2026-12-20',
    });
    await db.convertWishlistItemToExpense(wishlistId, 40000, '2026-12-20');
    const incomes = await db.getAllIncomes();
    const expenses = await db.getAllExpenses();

    // Цикл, который реально накрывает 20 декабря.
    const todayInsideFuturePeriod = new Date(2026, 10, 2); // 2 ноября
    const report = calculateReport({
      incomes,
      expenses,
      rules: [],
      assets: [],
      today: todayInsideFuturePeriod,
    });
    expect('code' in report).toBe(false);
    if ('code' in report) return;

    expect(report.expenseLines.some((l) => l.name === 'Отпуск в Сочи')).toBe(true);
    expect(report.totalExpenses).toBe(40000);
  });
});
