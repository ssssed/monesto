import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssetsService } from './assets.service';

const baseDto = {
  name: 'Сбережения',
  provider: 'rub' as const,
  icon: 'banknote',
  bgColor: '#DBEAFE',
  iconColor: '#3B82F6',
};

describe('AssetsService', () => {
  let prisma: any;
  let service: AssetsService;

  beforeEach(() => {
    prisma = {
      asset: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      expense: { findFirst: jest.fn() },
      assetTransaction: { findMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new AssetsService(prisma as unknown as PrismaService);
  });

  it('findAll orders by sortOrder', async () => {
    prisma.asset.findMany.mockResolvedValue([]);
    await service.findAll(1);
    expect(prisma.asset.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  });

  it("findOne throws NotFoundException for another user's asset", async () => {
    prisma.asset.findFirst.mockResolvedValue(null);
    await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
  });

  it('create rejects a linkedExpenseId owned by another user', async () => {
    prisma.expense.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ ...baseDto, linkedExpenseId: 7 }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('create parses creditStartDate when provided', async () => {
    prisma.asset.create.mockResolvedValue({ id: 1 });
    await service.create({ ...baseDto, creditStartDate: '2026-01-01' }, 1);
    expect(prisma.asset.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        ...baseDto,
        creditStartDate: new Date('2026-01-01'),
      },
    });
  });

  describe('getTransactions', () => {
    it('throws NotFoundException when the asset is not owned by the caller', async () => {
      prisma.asset.findFirst.mockResolvedValue(null);
      await expect(service.getTransactions(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lists transactions ordered by newest first once ownership is confirmed', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 1, userId: 1 });
      prisma.assetTransaction.findMany.mockResolvedValue([]);
      await service.getTransactions(1, 1);
      expect(prisma.assetTransaction.findMany).toHaveBeenCalledWith({
        where: { assetId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createTransaction', () => {
    function makeTx() {
      const tx = {
        assetTransaction: { create: jest.fn().mockResolvedValue({ id: 5 }) },
        asset: { update: jest.fn().mockResolvedValue({}) },
        expense: { update: jest.fn().mockResolvedValue({}) },
      };
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));
      return tx;
    }

    it('throws NotFoundException for an asset owned by another user', async () => {
      prisma.asset.findFirst.mockResolvedValue(null);
      await expect(
        service.createTransaction(1, 999, { amountDelta: 100 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    describe('rub/usd/gold/steam assets', () => {
      it('rub asset: costBasisRub delta equals amountDelta 1:1', async () => {
        prisma.asset.findFirst.mockResolvedValue({
          id: 1,
          provider: 'rub',
          currentAmount: 1000,
          costBasisRub: 1000,
        });
        const tx = makeTx();

        await service.createTransaction(1, 1, {
          amountDelta: 500,
          note: 'top up',
        });

        expect(tx.assetTransaction.create).toHaveBeenCalledWith({
          data: { assetId: 1, amountDelta: 500, note: 'top up', costRub: 500 },
        });
        expect(tx.asset.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { currentAmount: { increment: 500 }, costBasisRub: 1500 },
        });
      });

      it('usd asset withdrawal: costBasisRub delta uses average cost per unit', async () => {
        // 100 USD cost 8200 RUB total -> avg 82/unit; withdrawing 10 USD removes 820 RUB of basis
        prisma.asset.findFirst.mockResolvedValue({
          id: 1,
          provider: 'usd',
          currentAmount: 100,
          costBasisRub: 8200,
        });
        const tx = makeTx();

        await service.createTransaction(1, 1, { amountDelta: -10 });

        expect(tx.assetTransaction.create).toHaveBeenCalledWith({
          data: {
            assetId: 1,
            amountDelta: -10,
            note: undefined,
            costRub: -820,
          },
        });
        expect(tx.asset.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { currentAmount: { increment: -10 }, costBasisRub: 8200 - 820 },
        });
      });

      it('usd asset deposit does not touch cost basis via the average-cost path', async () => {
        prisma.asset.findFirst.mockResolvedValue({
          id: 1,
          provider: 'usd',
          currentAmount: 100,
          costBasisRub: 8200,
        });
        const tx = makeTx();

        await service.createTransaction(1, 1, { amountDelta: 10 });

        expect(tx.asset.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { currentAmount: { increment: 10 }, costBasisRub: 8200 },
        });
      });

      it('an explicit costRub override always wins over the computed delta', async () => {
        prisma.asset.findFirst.mockResolvedValue({
          id: 1,
          provider: 'rub',
          currentAmount: 1000,
          costBasisRub: 1000,
        });
        const tx = makeTx();

        await service.createTransaction(1, 1, {
          amountDelta: 500,
          costRub: 42,
        });

        expect(tx.asset.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { currentAmount: { increment: 500 }, costBasisRub: 1042 },
        });
      });

      it('costBasisRub never goes negative', async () => {
        prisma.asset.findFirst.mockResolvedValue({
          id: 1,
          provider: 'rub',
          currentAmount: 1000,
          costBasisRub: 100,
        });
        const tx = makeTx();

        await service.createTransaction(1, 1, { amountDelta: -900 });

        expect(tx.asset.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { currentAmount: { increment: -900 }, costBasisRub: 0 },
        });
      });
    });

    describe('credit assets', () => {
      const creditAsset = {
        id: 1,
        provider: 'credit',
        currentAmount: 800_000,
        costBasisRub: 0,
        linkedExpenseId: 9,
        creditAnnualRate: 19.9,
        creditTermMonths: 60,
        creditStartDate: new Date('2026-01-15T00:00:00.000Z'),
        creditRemainingMonths: null,
        creditEarlyRepayMode: null,
      };
      const linkedExpense = {
        id: 9,
        amount: 25_000,
        dueDay: 10,
        linkedAssetId: null,
      };

      it('debt increase (negative amountDelta) stores a positive delta and increments currentAmount', async () => {
        prisma.asset.findFirst.mockResolvedValue(creditAsset);
        const tx = makeTx();

        await service.createTransaction(1, 1, { amountDelta: -5000 });

        expect(tx.assetTransaction.create).toHaveBeenCalledWith({
          data: {
            assetId: 1,
            amountDelta: 5000,
            note: 'Увеличение долга',
            costRub: null,
          },
        });
        expect(tx.asset.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { currentAmount: { increment: 5000 } },
        });
      });

      it('repayment without a rate simply reduces the debt by the payment, clamped at 0', async () => {
        prisma.asset.findFirst.mockResolvedValue({
          ...creditAsset,
          creditAnnualRate: null,
        });
        prisma.expense.findFirst.mockResolvedValue(linkedExpense);
        const tx = makeTx();

        await service.createTransaction(1, 1, { amountDelta: 900_000 });

        expect(tx.assetTransaction.create).toHaveBeenCalledWith({
          data: {
            assetId: 1,
            amountDelta: -900_000,
            note: 'Погашение',
            costRub: 900_000,
          },
        });
        expect(tx.asset.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { currentAmount: 0 },
        });
      });

      it('repayment with a rate and reduce_term keeps the linked expense payment unchanged', async () => {
        prisma.asset.findFirst.mockResolvedValue(creditAsset);
        prisma.expense.findFirst.mockResolvedValue(linkedExpense);
        const tx = makeTx();

        await service.createTransaction(1, 1, {
          amountDelta: 100_000,
          earlyRepayMode: 'reduce_term' as any,
        });

        expect(tx.assetTransaction.create).toHaveBeenCalled();
        const createArgs = tx.assetTransaction.create.mock.calls[0][0];
        expect(createArgs.data.amountDelta).toBeLessThan(0); // -toPrincipal
        expect(tx.expense.update).not.toHaveBeenCalled();
        const updateArgs = tx.asset.update.mock.calls[0][0];
        expect(updateArgs.data.currentAmount).toBeLessThan(
          creditAsset.currentAmount,
        );
      });

      it('repayment with reduce_payment updates the linked expense amount and creditRemainingMonths', async () => {
        prisma.asset.findFirst.mockResolvedValue(creditAsset);
        prisma.expense.findFirst.mockResolvedValue(linkedExpense);
        const tx = makeTx();

        await service.createTransaction(1, 1, {
          amountDelta: 100_000,
          earlyRepayMode: 'reduce_payment' as any,
        });

        expect(tx.expense.update).toHaveBeenCalledWith({
          where: { id: 9 },
          data: { amount: expect.any(Number) },
        });
        const updateArgs = tx.asset.update.mock.calls[0][0];
        expect(updateArgs.data.creditRemainingMonths).toEqual(
          expect.any(Number),
        );
      });

      it('falls back to simple reduction when there is no linked expense at all', async () => {
        prisma.asset.findFirst.mockResolvedValue({
          ...creditAsset,
          linkedExpenseId: null,
        });
        prisma.expense.findFirst.mockResolvedValue(null);
        const tx = makeTx();

        await service.createTransaction(1, 1, { amountDelta: 100_000 });

        expect(tx.asset.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { currentAmount: 700_000 },
        });
      });

      it('resolves the linked expense by scanning linkedAssetId when asset.linkedExpenseId is unset', async () => {
        prisma.asset.findFirst.mockResolvedValue({
          ...creditAsset,
          linkedExpenseId: null,
        });
        prisma.expense.findFirst.mockResolvedValue({
          ...linkedExpense,
          id: 11,
        });
        makeTx();

        await service.createTransaction(1, 1, { amountDelta: 100_000 });

        expect(prisma.expense.findFirst).toHaveBeenCalledWith({
          where: { linkedAssetId: 1, userId: 1 },
        });
      });
    });
  });

  it('remove deletes an owned asset', async () => {
    prisma.asset.findFirst.mockResolvedValue({ id: 1, userId: 1 });
    await expect(service.remove(1, 1)).resolves.toEqual({ ok: true });
    expect(prisma.asset.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
