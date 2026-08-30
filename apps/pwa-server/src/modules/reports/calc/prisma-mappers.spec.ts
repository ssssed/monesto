import { Prisma } from '@prisma/client';
import {
  mapAsset,
  mapAssetTransaction,
  mapDistributionRule,
  mapExpense,
  mapIncomeSource,
  mapVacationPeriod,
} from './prisma-mappers';

describe('prisma-mappers', () => {
  it('mapIncomeSource converts Decimal/Date fields and passes through salaryTranches', () => {
    const result = mapIncomeSource({
      id: 1,
      userId: 1,
      name: 'Salary',
      currency: 'rub',
      incomeKind: 'fixed',
      amount: new Prisma.Decimal(100_000),
      monthlyAmount: null,
      isOneTime: false,
      recurrence: 'monthly',
      paymentDay: 10,
      isPrimary: true,
      primaryPaymentDay: 10,
      specificDate: null,
      salaryTranches: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    expect(result.amount).toBe(100_000);
    expect(result.monthlyAmount).toBeNull();
  });

  it('mapIncomeSource converts a date-only field via UTC getters', () => {
    const result = mapIncomeSource({
      id: 1,
      name: 'One-time',
      currency: 'rub',
      incomeKind: 'fixed',
      amount: new Prisma.Decimal(1000),
      monthlyAmount: null,
      isOneTime: true,
      recurrence: 'one_time',
      paymentDay: null,
      isPrimary: false,
      primaryPaymentDay: null,
      specificDate: new Date('2026-07-15T00:00:00.000Z'),
      salaryTranches: null,
    } as any);
    expect(result.specificDate).toBe('2026-07-15');
  });

  it('mapExpense converts amount and nullable date', () => {
    const result = mapExpense({
      id: 1,
      name: 'Rent',
      currency: 'rub',
      amount: new Prisma.Decimal(30_000),
      recurrence: 'monthly',
      dueDay: 5,
      specificDate: null,
      linkedAssetId: null,
    } as any);
    expect(result.amount).toBe(30_000);
    expect(result.specificDate).toBeNull();
  });

  it('mapAsset converts every Decimal field to number', () => {
    const result = mapAsset({
      id: 1,
      name: 'Credit',
      provider: 'credit',
      goalAmount: new Prisma.Decimal(1_000_000),
      currentAmount: new Prisma.Decimal(800_000),
      icon: 'i',
      bgColor: '#fff',
      iconColor: '#000',
      costBasisRub: new Prisma.Decimal(0),
      linkedExpenseId: 5,
      creditAnnualRate: new Prisma.Decimal(19.9),
      creditTermMonths: 60,
      creditStartDate: new Date('2026-01-15T00:00:00.000Z'),
      creditRemainingMonths: null,
      creditEarlyRepayMode: null,
    } as any);
    expect(result.goalAmount).toBe(1_000_000);
    expect(result.currentAmount).toBe(800_000);
    expect(result.creditAnnualRate).toBe(19.9);
    expect(result.creditStartDate).toBe('2026-01-15');
  });

  it('mapDistributionRule converts the value field', () => {
    const result = mapDistributionRule({
      id: 1,
      name: 'Rule',
      ruleType: 'percent',
      value: new Prisma.Decimal(20),
      currency: 'rub',
      targetAssetId: null,
      sortOrder: 0,
      creditEarlyRepayMode: null,
    } as any);
    expect(result.value).toBe(20);
  });

  it('mapVacationPeriod converts both date-only fields', () => {
    const result = mapVacationPeriod({
      id: 1,
      startDate: new Date('2026-07-01T00:00:00.000Z'),
      endDate: new Date('2026-07-14T00:00:00.000Z'),
    } as any);
    expect(result).toEqual({
      id: 1,
      startDate: '2026-07-01',
      endDate: '2026-07-14',
    });
  });

  it('mapAssetTransaction converts amountDelta and keeps createdAt as a Date', () => {
    const createdAt = new Date();
    const result = mapAssetTransaction({
      assetId: 1,
      amountDelta: new Prisma.Decimal(-500),
      createdAt,
    } as any);
    expect(result.amountDelta).toBe(-500);
    expect(result.createdAt).toBe(createdAt);
  });
});
