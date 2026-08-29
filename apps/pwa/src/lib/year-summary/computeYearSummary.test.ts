import { describe, expect, it } from 'vitest';

import {
  computeYearSummary,
  YEAR_SUMMARY_DELTA_EPS,
} from './computeYearSummary';
import type { Asset, AssetTransaction } from '@/lib/types';

const NOW = new Date('2026-08-27T12:00:00.000Z');

function asset(
  partial: Partial<Asset> & Pick<Asset, 'id' | 'name' | 'current_amount'>,
): Asset {
  return {
    provider: 'rub',
    purpose: null,
    goal_amount: null,
    steam_inventory_url: null,
    icon: 'wallet',
    bg_color: '#DBEAFE',
    icon_color: '#2563EB',
    cost_basis_rub: 0,
    linked_expense_id: null,
    credit_annual_rate: null,
    credit_term_months: null,
    credit_start_date: null,
    credit_remaining_months: null,
    credit_early_repay_mode: null,
    sort_order: partial.id,
    ...partial,
  };
}

function tx(
  partial: Pick<AssetTransaction, 'id' | 'asset_id' | 'amount_delta' | 'created_at'>,
): AssetTransaction {
  return {
    note: null,
    cost_rub: null,
    ...partial,
  };
}

describe('виджет «Итоги года» — 3 сценария', () => {
  it('рост: хвалит пользователя и напоминает про маленькие шаги', () => {
    const assets = [
      asset({ id: 1, name: 'подушка', current_amount: 50_000 }),
      asset({ id: 2, name: 'наличка', current_amount: 20_000 }),
    ];
    const transactions = [
      tx({
        id: 1,
        asset_id: 1,
        amount_delta: 30_000,
        created_at: '2025-06-01T00:00:00.000Z',
      }),
      tx({
        id: 2,
        asset_id: 1,
        amount_delta: 20_000,
        created_at: '2026-03-01T00:00:00.000Z',
      }),
      tx({
        id: 3,
        asset_id: 2,
        amount_delta: 10_000,
        created_at: '2025-11-01T00:00:00.000Z',
      }),
      tx({
        id: 4,
        asset_id: 2,
        amount_delta: 10_000,
        created_at: '2026-04-01T00:00:00.000Z',
      }),
    ];

    const summary = computeYearSummary({
      assets,
      transactions,
      usdRubRate: 80,
      now: NOW,
    });

    expect(summary.tone).toBe('growth');
    expect(summary.deltaRub).toBeGreaterThan(YEAR_SUMMARY_DELTA_EPS);
    expect(summary.totalAtYearStartRub).toBe(40_000);
    expect(summary.totalNowRub).toBe(70_000);
    expect(summary.headline).toMatch(/молодец/i);
    expect(summary.message).toMatch(/маленьк/i);
    expect(summary.message).toMatch(/вырос|прибави|шаг/i);
    expect(summary.bannerHint).toMatch(/\+/);
    expect(summary.closingTitle.length).toBeGreaterThan(0);
    expect(summary.assets).toHaveLength(2);
  });

  it('отрицательный рост: если стало меньше стартового баланса по всем активам — поддерживает без советов как копить', () => {
    const assets = [
      asset({ id: 1, name: 'подушка', current_amount: 15_000 }),
      asset({ id: 2, name: 'наличка', current_amount: 5_000 }),
    ];
    const transactions = [
      tx({
        id: 1,
        asset_id: 1,
        amount_delta: 40_000,
        created_at: '2025-01-15T00:00:00.000Z',
      }),
      tx({
        id: 2,
        asset_id: 1,
        amount_delta: -25_000,
        created_at: '2026-02-10T00:00:00.000Z',
      }),
      tx({
        id: 3,
        asset_id: 2,
        amount_delta: 20_000,
        created_at: '2025-03-01T00:00:00.000Z',
      }),
      tx({
        id: 4,
        asset_id: 2,
        amount_delta: -15_000,
        created_at: '2026-05-01T00:00:00.000Z',
      }),
    ];

    const summary = computeYearSummary({
      assets,
      transactions,
      usdRubRate: 80,
      now: NOW,
    });

    expect(summary.tone).toBe('decline');
    expect(summary.deltaRub).toBeLessThan(-YEAR_SUMMARY_DELTA_EPS);
    expect(summary.totalAtYearStartRub).toBe(60_000);
    expect(summary.totalNowRub).toBe(20_000);
    expect(summary.headline).toMatch(/рядом/i);
    expect(summary.message).toMatch(/меньше|бывает|не провал|в игре/i);
    expect(summary.message).not.toMatch(
      /отклад|совету|нужно копить|бюджет|эконом/i,
    );
    expect(summary.bannerHint.length).toBeGreaterThan(0);
  });

  it('нейтральный: сумма почти та же — про стабильность и мягкий призыв учитывать доходы/расходы', () => {
    const assets = [
      asset({ id: 1, name: 'подушка', current_amount: 30_000 }),
      asset({ id: 2, name: 'наличка', current_amount: 10_000 }),
    ];
    const transactions = [
      tx({
        id: 1,
        asset_id: 1,
        amount_delta: 30_000,
        created_at: '2025-02-01T00:00:00.000Z',
      }),
      tx({
        id: 2,
        asset_id: 2,
        amount_delta: 10_000,
        created_at: '2025-02-01T00:00:00.000Z',
      }),
      tx({
        id: 3,
        asset_id: 1,
        amount_delta: 2_000,
        created_at: '2026-01-20T00:00:00.000Z',
      }),
      tx({
        id: 4,
        asset_id: 1,
        amount_delta: -2_000,
        created_at: '2026-06-01T00:00:00.000Z',
      }),
    ];

    const summary = computeYearSummary({
      assets,
      transactions,
      usdRubRate: 80,
      now: NOW,
    });

    expect(summary.tone).toBe('stable');
    expect(Math.abs(summary.deltaRub)).toBeLessThanOrEqual(YEAR_SUMMARY_DELTA_EPS);
    expect(summary.totalNowRub).toBe(40_000);
    expect(summary.totalAtYearStartRub).toBe(40_000);
    expect(summary.headline).toMatch(/стабильность/i);
    expect(summary.message).toMatch(/стабильн|спокойств|предсказуем/i);
    expect(summary.message).toMatch(/доход|расход|отклад/i);
    expect(summary.closingMessage).toMatch(/цикл|главн|деньг/i);
  });
});

describe('база периода для новых активов', () => {
  it('актив создан в августе с начальной суммой — итоги от этой суммы, а не от нуля', () => {
    const assets = [
      asset({ id: 1, name: 'подушка', current_amount: 50_000 }),
    ];
    const transactions = [
      tx({
        id: 1,
        asset_id: 1,
        amount_delta: 50_000,
        created_at: '2026-08-28T10:00:00.000Z',
      }),
    ];

    const summary = computeYearSummary({
      assets,
      transactions,
      usdRubRate: 80,
      now: new Date('2026-08-28T12:00:00.000Z'),
    });

    expect(summary.totalAtYearStartRub).toBe(50_000);
    expect(summary.totalNowRub).toBe(50_000);
    expect(summary.deltaRub).toBe(0);
    expect(summary.tone).toBe('stable');
    expect(summary.assets[0]?.startRub).toBe(50_000);
  });

  it('после создания в течение года рост считает только последующие движения', () => {
    const assets = [
      asset({ id: 1, name: 'подушка', current_amount: 65_000 }),
    ];
    const transactions = [
      tx({
        id: 1,
        asset_id: 1,
        amount_delta: 50_000,
        created_at: '2026-08-28T10:00:00.000Z',
      }),
      tx({
        id: 2,
        asset_id: 1,
        amount_delta: 15_000,
        created_at: '2026-09-01T10:00:00.000Z',
      }),
    ];

    const summary = computeYearSummary({
      assets,
      transactions,
      usdRubRate: 80,
      now: new Date('2026-09-02T12:00:00.000Z'),
    });

    expect(summary.totalAtYearStartRub).toBe(50_000);
    expect(summary.totalNowRub).toBe(65_000);
    expect(summary.deltaRub).toBe(15_000);
    expect(summary.tone).toBe('growth');
  });

  it('в следующем году базой становится баланс на 1 января', () => {
    const assets = [
      asset({ id: 1, name: 'подушка', current_amount: 80_000 }),
    ];
    const transactions = [
      tx({
        id: 1,
        asset_id: 1,
        amount_delta: 50_000,
        created_at: '2026-08-28T10:00:00.000Z',
      }),
      tx({
        id: 2,
        asset_id: 1,
        amount_delta: 20_000,
        created_at: '2026-11-01T10:00:00.000Z',
      }),
      tx({
        id: 3,
        asset_id: 1,
        amount_delta: 10_000,
        created_at: '2027-03-01T10:00:00.000Z',
      }),
    ];

    const summary = computeYearSummary({
      assets,
      transactions,
      usdRubRate: 80,
      now: new Date('2027-06-01T12:00:00.000Z'),
    });

    expect(summary.year).toBe(2027);
    expect(summary.totalAtYearStartRub).toBe(70_000);
    expect(summary.totalNowRub).toBe(80_000);
    expect(summary.deltaRub).toBe(10_000);
    expect(summary.tone).toBe('growth');
  });
});
