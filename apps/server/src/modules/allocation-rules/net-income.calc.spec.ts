import { FinanceType } from '@prisma/client';
import {
  calculateNetIncome,
  sumFinanceRecordsByType,
  type FinanceRecordAmount,
} from './net-income.calc';

describe('net-income.calc', () => {
  describe('sumFinanceRecordsByType', () => {
    it('суммирует только общие записи (name = null), если детализации нет', () => {
      const records: FinanceRecordAmount[] = [
        { type: FinanceType.income, name: null, amount: 100_000 },
      ];

      expect(sumFinanceRecordsByType(records, FinanceType.income)).toBe(100_000);
    });

    it('суммирует только детализированные записи, если они есть', () => {
      const records: FinanceRecordAmount[] = [
        { type: FinanceType.income, name: null, amount: 100_000 },
        { type: FinanceType.income, name: 'ЗП', amount: 80_000 },
        { type: FinanceType.income, name: 'Премия', amount: 20_000 },
      ];

      expect(sumFinanceRecordsByType(records, FinanceType.income)).toBe(100_000);
    });

    it('не смешивает income и expense', () => {
      const records: FinanceRecordAmount[] = [
        { type: FinanceType.income, name: 'ЗП', amount: 100_000 },
        { type: FinanceType.expense, name: 'Аренда', amount: 30_000 },
        { type: FinanceType.expense, name: null, amount: 99_999 },
      ];

      expect(sumFinanceRecordsByType(records, FinanceType.expense)).toBe(30_000);
    });

    it('суммирует несколько общих записей, если детализации нет', () => {
      const records: FinanceRecordAmount[] = [
        { type: FinanceType.expense, name: null, amount: 10_000 },
        { type: FinanceType.expense, name: null, amount: 5_000 },
      ];

      expect(sumFinanceRecordsByType(records, FinanceType.expense)).toBe(15_000);
    });
  });

  describe('calculateNetIncome', () => {
    it('общий доход и общие расходы', () => {
      const records: FinanceRecordAmount[] = [
        { type: FinanceType.income, name: null, amount: 100_000 },
        { type: FinanceType.expense, name: null, amount: 40_000 },
      ];

      expect(calculateNetIncome(records)).toBe(60_000);
    });

    it('детализированный income и детализированный mandatory', () => {
      const records: FinanceRecordAmount[] = [
        { type: FinanceType.income, name: null, amount: 999_999 },
        { type: FinanceType.income, name: 'ЗП', amount: 90_000 },
        { type: FinanceType.income, name: 'Фриланс', amount: 10_000 },
        { type: FinanceType.expense, name: null, amount: 999_999 },
        { type: FinanceType.expense, name: 'Ипотека', amount: 25_000 },
        { type: FinanceType.expense, name: 'Еда', amount: 15_000 },
      ];

      expect(calculateNetIncome(records)).toBe(60_000);
    });

    it('не уходит в минус', () => {
      const records: FinanceRecordAmount[] = [
        { type: FinanceType.income, name: null, amount: 10_000 },
        { type: FinanceType.expense, name: 'Расходы', amount: 50_000 },
      ];

      expect(calculateNetIncome(records)).toBe(0);
    });

    it('учитывает unallocated в детализированных расходах', () => {
      const records: FinanceRecordAmount[] = [
        { type: FinanceType.income, name: null, amount: 208_600 },
        { type: FinanceType.expense, name: 'unallocated', amount: 10_000 },
        { type: FinanceType.expense, name: 'кредит', amount: 35_000 },
        { type: FinanceType.expense, name: 'еда', amount: 35_000 },
      ];

      expect(calculateNetIncome(records)).toBe(128_600);
    });
  });
});
