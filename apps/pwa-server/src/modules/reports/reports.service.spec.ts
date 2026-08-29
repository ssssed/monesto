import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { FxRateService } from '../fx/fx-rate.service';
import { ReportsService } from './reports.service';

const primaryIncomeRow = {
  id: 1,
  name: 'Salary',
  currency: 'rub',
  incomeKind: 'fixed',
  amount: { toString: () => '100000' } as any,
  monthlyAmount: null,
  isOneTime: false,
  recurrence: 'monthly',
  paymentDay: 25,
  isPrimary: true,
  primaryPaymentDay: 25,
  specificDate: null,
  salaryTranches: null,
};

function num(value: number) {
  return { toString: () => String(value), valueOf: () => value } as any;
}

describe('ReportsService', () => {
  let prisma: any;
  let fxRateService: { getLatest: jest.Mock };
  let assetsService: { createTransaction: jest.Mock };
  let service: ReportsService;

  beforeEach(() => {
    prisma = {
      incomeSource: { findMany: jest.fn().mockResolvedValue([]) },
      expense: { findMany: jest.fn().mockResolvedValue([]) },
      distributionRule: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      asset: { findMany: jest.fn().mockResolvedValue([]) },
      vacationPeriod: { findMany: jest.fn().mockResolvedValue([]) },
      assetTransaction: { findMany: jest.fn().mockResolvedValue([]) },
      allocationConfirmation: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      allocationRejection: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };
    fxRateService = { getLatest: jest.fn() };
    assetsService = { createTransaction: jest.fn() };
    service = new ReportsService(
      prisma as unknown as PrismaService,
      fxRateService as unknown as FxRateService,
      assetsService as unknown as AssetsService,
    );
  });

  describe('getCurrentReport', () => {
    it('throws a BadRequestException with the report error code when there is no primary income', async () => {
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));
      await expect(service.getCurrentReport(1, {})).rejects.toMatchObject({
        response: { code: 'NO_PRIMARY_SALARY' },
      });
    });

    it('falls back to the 82 default rate when no fx rate exists yet', async () => {
      prisma.incomeSource.findMany.mockResolvedValue([primaryIncomeRow]);
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));

      const result = await service.getCurrentReport(1, {});
      expect(result.usdRubRate).toBe(82);
    });

    it('uses the latest fx rate when available', async () => {
      prisma.incomeSource.findMany.mockResolvedValue([primaryIncomeRow]);
      fxRateService.getLatest.mockResolvedValue({ rate: num(90) });

      const result = await service.getCurrentReport(1, {});
      expect(result.usdRubRate).toBe(90);
    });

    it('merges confirmation/rejection status into allocations for the resolved cycleKey', async () => {
      prisma.incomeSource.findMany.mockResolvedValue([primaryIncomeRow]);
      prisma.distributionRule.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Save',
          ruleType: 'percent',
          value: 10,
          currency: 'rub',
          targetAssetId: null,
          sortOrder: 0,
          creditEarlyRepayMode: null,
        },
        {
          id: 2,
          name: 'Save more',
          ruleType: 'percent',
          value: 5,
          currency: 'rub',
          targetAssetId: null,
          sortOrder: 1,
          creditEarlyRepayMode: null,
        },
      ]);
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));
      prisma.allocationConfirmation.findMany.mockResolvedValue([{ ruleId: 1 }]);
      prisma.allocationRejection.findMany.mockResolvedValue([{ ruleId: 2 }]);

      const result = await service.getCurrentReport(1, {});
      const byId = new Map(result.allocations.map((a) => [a.ruleId, a.status]));
      expect(byId.get(1)).toBe('confirmed');
      expect(byId.get(2)).toBe('rejected');
    });

    it('passes an explicit today query param through to the calculation', async () => {
      prisma.incomeSource.findMany.mockResolvedValue([primaryIncomeRow]);
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));

      const result = await service.getCurrentReport(1, { today: '2026-07-01' });
      expect(result.cycleKey).toMatch(/^2026-07-25$/);
    });
  });

  describe('listCycles', () => {
    it('throws BadRequestException when there is no primary income', async () => {
      await expect(service.listCycles(1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns one cycle per schedule day', async () => {
      prisma.incomeSource.findMany.mockResolvedValue([primaryIncomeRow]);
      const cycles = await service.listCycles(1, { today: '2026-07-01' });
      expect(cycles.length).toBeGreaterThan(0);
      for (const cycle of cycles) {
        expect(cycle).toHaveProperty('nominalDate');
        expect(cycle).toHaveProperty('payoutDate');
      }
    });
  });

  describe('getYearSummary', () => {
    it('defaults usdRubRate to 82 and now to the current date when not given', async () => {
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));
      const summary = await service.getYearSummary(1, {});
      expect(summary.usdRubRate).toBe(82);
      expect(summary.year).toBe(new Date().getFullYear());
    });
  });

  describe('getRulesBudget', () => {
    it('falls back to a 100000 remainder when the report cannot be calculated', async () => {
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));
      prisma.distributionRule.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Save',
          ruleType: 'percent',
          value: 10,
          currency: 'rub',
          targetAssetId: null,
          sortOrder: 0,
          creditEarlyRepayMode: null,
        },
      ]);

      const summary = await service.getRulesBudget(1, {});
      expect(summary.remainder).toBe(100_000);
      expect(summary.slices[0].amountRub).toBe(10_000);
    });

    it('excludes the given rule id from the summary', async () => {
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));
      prisma.distributionRule.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'A',
          ruleType: 'percent',
          value: 10,
          currency: 'rub',
          targetAssetId: null,
          sortOrder: 0,
          creditEarlyRepayMode: null,
        },
        {
          id: 2,
          name: 'B',
          ruleType: 'percent',
          value: 20,
          currency: 'rub',
          targetAssetId: null,
          sortOrder: 1,
          creditEarlyRepayMode: null,
        },
      ]);

      const summary = await service.getRulesBudget(1, { excludeRuleId: 2 });
      expect(summary.slices).toHaveLength(1);
      expect(summary.slices[0].ruleId).toBe(1);
    });
  });

  describe('confirmAllocation', () => {
    const rule = {
      id: 1,
      name: 'Save',
      ruleType: 'percent',
      value: 20,
      currency: 'rub',
      targetAssetId: 5,
      sortOrder: 0,
      creditEarlyRepayMode: null,
    };

    beforeEach(() => {
      prisma.incomeSource.findMany.mockResolvedValue([primaryIncomeRow]);
      prisma.distributionRule.findMany.mockResolvedValue([rule]);
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));
    });

    it('throws NotFoundException when the rule does not belong to the caller', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue(null);
      await expect(
        service.confirmAllocation(1, 1, '2026-07-25'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns already_rejected without writing when a rejection already exists', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue(rule);
      prisma.allocationRejection.findUnique.mockResolvedValue({ id: 1 });

      const result = await service.confirmAllocation(1, 1, '2026-07-25');
      expect(result).toEqual({ status: 'already_rejected' });
      expect(prisma.allocationConfirmation.create).not.toHaveBeenCalled();
    });

    it('returns already_confirmed without writing when already confirmed', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue(rule);
      prisma.allocationConfirmation.findUnique.mockResolvedValue({ id: 1 });

      const result = await service.confirmAllocation(1, 1, '2026-07-25');
      expect(result).toEqual({ status: 'already_confirmed' });
    });

    it('recomputes the amount server-side, records the confirmation, and deposits into the target asset', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue(rule);
      prisma.asset.findMany.mockResolvedValue([
        {
          id: 5,
          provider: 'rub',
          currentAmount: 0,
          costBasisRub: 0,
          icon: 'i',
          bgColor: '#fff',
          iconColor: '#000',
          goalAmount: null,
          linkedExpenseId: null,
          creditAnnualRate: null,
          creditTermMonths: null,
          creditStartDate: null,
          creditRemainingMonths: null,
          creditEarlyRepayMode: null,
          name: 'Копилка',
        },
      ]);
      assetsService.createTransaction.mockResolvedValue({ id: 99 });

      const result = await service.confirmAllocation(1, 1, '2026-07-25');

      expect(prisma.allocationConfirmation.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          ruleId: 1,
          cycleKey: '2026-07-25',
          amountRub: 20_000,
        },
      });
      expect(assetsService.createTransaction).toHaveBeenCalledWith(5, 1, {
        amountDelta: 20_000,
        note: 'Погашение из отчёта',
        costRub: 20_000,
        earlyRepayMode: undefined,
      });
      expect(result).toEqual({
        status: 'ok',
        amountRub: 20_000,
        transaction: { id: 99 },
      });
    });

    it('converts the deposit amount to native usd for a usd target asset', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue(rule);
      prisma.asset.findMany.mockResolvedValue([
        {
          id: 5,
          provider: 'usd',
          currentAmount: 0,
          costBasisRub: 0,
          icon: 'i',
          bgColor: '#fff',
          iconColor: '#000',
          goalAmount: null,
          linkedExpenseId: null,
          creditAnnualRate: null,
          creditTermMonths: null,
          creditStartDate: null,
          creditRemainingMonths: null,
          creditEarlyRepayMode: null,
          name: 'USD',
        },
      ]);
      assetsService.createTransaction.mockResolvedValue({ id: 99 });

      await service.confirmAllocation(1, 1, '2026-07-25');

      expect(assetsService.createTransaction).toHaveBeenCalledWith(5, 1, {
        amountDelta: 20_000 / 82,
        note: 'Погашение из отчёта',
        costRub: 20_000,
        earlyRepayMode: undefined,
      });
    });

    it('does not touch any asset when the rule has no target', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue({
        ...rule,
        targetAssetId: null,
      });

      const result = await service.confirmAllocation(1, 1, '2026-07-25');

      expect(assetsService.createTransaction).not.toHaveBeenCalled();
      expect(result.transaction).toBeNull();
    });
  });

  describe('rejectAllocation', () => {
    const rule = {
      id: 1,
      name: 'Save',
      ruleType: 'percent',
      value: 20,
      currency: 'rub',
      targetAssetId: 5,
      sortOrder: 0,
      creditEarlyRepayMode: null,
    };

    it('throws NotFoundException when the rule does not belong to the caller', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue(null);
      await expect(
        service.rejectAllocation(1, 1, '2026-07-25'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns already_confirmed without writing when already confirmed', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue(rule);
      prisma.allocationConfirmation.findUnique.mockResolvedValue({ id: 1 });

      const result = await service.rejectAllocation(1, 1, '2026-07-25');
      expect(result).toEqual({ status: 'already_confirmed' });
      expect(prisma.allocationRejection.create).not.toHaveBeenCalled();
    });

    it('records a rejection with no money movement', async () => {
      prisma.distributionRule.findFirst.mockResolvedValue(rule);

      const result = await service.rejectAllocation(1, 1, '2026-07-25');

      expect(prisma.allocationRejection.create).toHaveBeenCalledWith({
        data: { userId: 1, ruleId: 1, cycleKey: '2026-07-25' },
      });
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('getDraftRulesBudget', () => {
    it('includes the draft rule alongside existing ones', async () => {
      fxRateService.getLatest.mockRejectedValue(new Error('not found'));
      const summary = await service.getDraftRulesBudget(1, {
        name: 'Draft',
        ruleType: 'percent' as any,
        value: 15,
        currency: 'rub' as any,
      });
      expect(summary.slices).toHaveLength(1);
      expect(summary.slices[0].amountRub).toBe(15_000);
    });
  });
});
