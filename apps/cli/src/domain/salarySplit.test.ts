import { describe, it, expect } from 'vitest';
import { splitNetIncomeByWorkdays } from './salarySplit.js';

describe('splitNetIncomeByWorkdays', () => {
  it('как в расчётном листке: оклад 240000, налог 13%, 10.03 = 98 905.21 за 16–конец февраля (9 раб.дн.)', () => {
    const gross = 240_000;
    const taxPercent = 13;
    const netIncome = gross * (1 - taxPercent / 100); // 208_800
    const year = 2026;
    const month = 3; // март: 10.03 = хвост февраля, 25.03 = аванс марта

    const result = splitNetIncomeByWorkdays({ netIncome, year, month });

    expect(result.salaryDate.getDate()).toBe(10);
    expect(result.salaryDate.getMonth()).toBe(2);
    expect(result.salaryDate.getFullYear()).toBe(2026);
    expect(result.imprestDate.getDate()).toBe(25);

    // Февраль 2026: 1–15 = 10 раб.дн., 16–28 (23 праздник) = 9 раб.дн., всего 19
    expect(result.workdays.salary).toBe(9);
    expect(result.workdays.total).toBe(9 + 10); // 9 (фев 16–28) + 10 (март 1–15)

    // 10.03 = 208_800 * (9/19) = 98_905,26 ≈ 98_905,21 по листку
    expect(result.salaryAmount).toBeCloseTo(98_905.21, 0);
  });

  it('100000 нетто: 10.03 = доля от февраля (16–конец), 25.03 = доля от марта (1–15)', () => {
    const result = splitNetIncomeByWorkdays({ netIncome: 100_000, year: 2026, month: 3 });

    expect(result.workdays.salary).toBe(9); // фев 16–28 без 23.02
    expect(result.workdays.imprest).toBe(10); // март 1–15 (8 марта 2026 — вс, уже выходной)
    expect(result.salaryAmount).toBeCloseTo(100_000 * (9 / 19), 2); // 47_368.42
    expect(result.imprestAmount).toBeCloseTo(100_000 * (10 / 22), 2); // 45_454.55
  });
});
