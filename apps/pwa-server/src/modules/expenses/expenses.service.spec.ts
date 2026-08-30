import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpensesService } from './expenses.service';

const baseDto = {
  name: 'Аренда',
  currency: 'rub' as const,
  amount: 45000,
  recurrence: 'monthly' as const,
};

describe('ExpensesService', () => {
  let prisma: any;
  let service: ExpensesService;

  beforeEach(() => {
    prisma = {
      expense: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      asset: { findFirst: jest.fn() },
    };
    service = new ExpensesService(prisma as unknown as PrismaService);
  });

  it('findAll scopes to userId', async () => {
    prisma.expense.findMany.mockResolvedValue([]);
    await service.findAll(1);
    expect(prisma.expense.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { id: 'asc' },
    });
  });

  it("findOne throws NotFoundException for another user's row", async () => {
    prisma.expense.findFirst.mockResolvedValue(null);
    await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
  });

  it('create works without a linkedAssetId', async () => {
    prisma.expense.create.mockResolvedValue({ id: 1 });
    await service.create(baseDto, 1);
    expect(prisma.asset.findFirst).not.toHaveBeenCalled();
    expect(prisma.expense.create).toHaveBeenCalledWith({
      data: { userId: 1, ...baseDto, specificDate: undefined },
    });
  });

  it('create rejects a linkedAssetId owned by another user', async () => {
    prisma.asset.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ ...baseDto, linkedAssetId: 42 }, 1),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.expense.create).not.toHaveBeenCalled();
  });

  it('create accepts a linkedAssetId owned by the caller', async () => {
    prisma.asset.findFirst.mockResolvedValue({ id: 42, userId: 1 });
    prisma.expense.create.mockResolvedValue({ id: 1 });
    await service.create({ ...baseDto, linkedAssetId: 42 }, 1);
    expect(prisma.expense.create).toHaveBeenCalled();
  });

  it("update throws NotFoundException for another user's row", async () => {
    prisma.expense.findFirst.mockResolvedValue(null);
    await expect(service.update(1, { name: 'X' }, 999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove deletes an owned row', async () => {
    prisma.expense.findFirst.mockResolvedValue({ id: 1, userId: 1 });
    await expect(service.remove(1, 1)).resolves.toEqual({ ok: true });
    expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
