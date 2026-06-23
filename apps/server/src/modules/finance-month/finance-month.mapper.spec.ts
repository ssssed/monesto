import { FinanceType, type FinanceRecord } from '@prisma/client';
import { UNALLOCATED_MANDATORY_NAME } from './lib/mandatory-breakdown.constants';
import {
  mapRecordsToMonthFinanceView,
  resolveMandatoryLines,
} from './finance-month.mapper';

function record(
  partial: Pick<FinanceRecord, 'id' | 'type' | 'name' | 'amount'>,
): FinanceRecord {
  return {
    ...partial,
    userId: 1,
    currency: 'rub' as FinanceRecord['currency'],
    month: 6,
    year: 2026,
    amount: partial.amount as FinanceRecord['amount'],
  };
}

describe('finance-month.mapper', () => {
  describe('mapRecordsToMonthFinanceView', () => {
    it('empty когда нет записей', () => {
      expect(mapRecordsToMonthFinanceView([])).toEqual({
        status: 'empty',
        incoming: { filled: false, value: '', breakdown: [] },
        mandatory: { filled: false, value: '', breakdown: [] },
      });
    });

    it('partial когда заполнен только income', () => {
      const view = mapRecordsToMonthFinanceView([
        record({ id: 1, type: FinanceType.income, name: null, amount: 100_000 as never }),
      ]);

      expect(view.status).toBe('partial');
      expect(view.incoming).toEqual({
        filled: true,
        value: '100000',
        breakdown: [],
      });
      expect(view.mandatory.filled).toBe(false);
    });

    it('complete когда оба шага заполнены', () => {
      const view = mapRecordsToMonthFinanceView([
        record({ id: 1, type: FinanceType.income, name: null, amount: 100_000 as never }),
        record({ id: 2, type: FinanceType.expense, name: null, amount: 40_000 as never }),
      ]);

      expect(view.status).toBe('complete');
    });

    it('mandatory с детализацией без aggregate', () => {
      const view = mapRecordsToMonthFinanceView([
        record({ id: 1, type: FinanceType.expense, name: null, amount: 99_999 as never }),
        record({ id: 2, type: FinanceType.expense, name: 'Rent', amount: 25_000 as never }),
        record({ id: 3, type: FinanceType.expense, name: 'Food', amount: 15_000 as never }),
      ]);

      expect(view.mandatory).toEqual({
        filled: true,
        value: '40000',
        breakdown: [
          { id: '2', kind: 'custom', label: 'Rent', amount: '25000' },
          { id: '3', kind: 'custom', label: 'Food', amount: '15000' },
        ],
      });
    });

    it('mandatory восстанавливает unallocated строку', () => {
      const view = mapRecordsToMonthFinanceView([
        record({
          id: 1,
          type: FinanceType.expense,
          name: UNALLOCATED_MANDATORY_NAME,
          amount: 10_000 as never,
        }),
        record({ id: 2, type: FinanceType.expense, name: 'кредит', amount: 35_000 as never }),
        record({ id: 3, type: FinanceType.expense, name: 'еда', amount: 25_000 as never }),
      ]);

      expect(view.mandatory).toEqual({
        filled: true,
        value: '70000',
        breakdown: [
          {
            id: '1',
            kind: 'unallocated',
            label: 'не распределено',
            amount: '10000',
          },
          { id: '2', kind: 'custom', label: 'кредит', amount: '35000' },
          { id: '3', kind: 'custom', label: 'еда', amount: '25000' },
        ],
      });
    });
  });

  describe('resolveMandatoryLines', () => {
    it('сохраняет custom и unallocated строки', () => {
      expect(
        resolveMandatoryLines('70000', [
          {
            kind: 'unallocated',
            label: 'не распределено',
            amount: '10000',
          },
          { kind: 'custom', label: 'кредит', amount: '35000' },
          { kind: 'custom', label: 'еда', amount: '25000' },
        ]),
      ).toEqual({
        mode: 'detailed',
        rows: [
          { name: UNALLOCATED_MANDATORY_NAME, amount: 10_000 },
          { name: 'кредит', amount: 35_000 },
          { name: 'еда', amount: 25_000 },
        ],
      });
    });

    it('использует aggregate если breakdown пуст', () => {
      expect(resolveMandatoryLines('40000', [])).toEqual({
        mode: 'aggregate',
        amount: 40_000,
      });
    });
  });
});
