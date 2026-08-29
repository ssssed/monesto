import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncomeSourcesService } from './income-sources.service';

const baseDto = {
  name: 'Зарплата',
  currency: 'rub' as const,
  incomeKind: 'fixed' as const,
  isOneTime: false,
  recurrence: 'monthly' as const,
  isPrimary: true,
};

describe('IncomeSourcesService', () => {
  let prisma: any;
  let service: IncomeSourcesService;

  beforeEach(() => {
    prisma = {
      incomeSource: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new IncomeSourcesService(prisma as unknown as PrismaService);
  });

  it('findAll scopes to userId', async () => {
    prisma.incomeSource.findMany.mockResolvedValue([]);
    await service.findAll(1);
    expect(prisma.incomeSource.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { id: 'asc' },
    });
  });

  it("findOne throws NotFoundException for another user's row", async () => {
    prisma.incomeSource.findFirst.mockResolvedValue(null);
    await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
  });

  it('create scopes the row to userId and serializes salaryTranches', async () => {
    prisma.incomeSource.create.mockResolvedValue({ id: 1 });
    const tranches = [
      {
        paymentDay: 10,
        periodFromDay: 1,
        periodToDay: 15,
        periodMonthOffset: 0 as const,
      },
    ];
    await service.create({ ...baseDto, salaryTranches: tranches }, 1);

    expect(prisma.incomeSource.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        ...baseDto,
        salaryTranches: tranches,
        specificDate: undefined,
      },
    });
  });

  it("update throws NotFoundException for another user's row", async () => {
    prisma.incomeSource.findFirst.mockResolvedValue(null);
    await expect(service.update(1, { name: 'X' }, 999)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.incomeSource.update).not.toHaveBeenCalled();
  });

  it("remove throws NotFoundException for another user's row", async () => {
    prisma.incomeSource.findFirst.mockResolvedValue(null);
    await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
    expect(prisma.incomeSource.delete).not.toHaveBeenCalled();
  });

  it('remove deletes an owned row', async () => {
    prisma.incomeSource.findFirst.mockResolvedValue({ id: 1, userId: 1 });
    await expect(service.remove(1, 1)).resolves.toEqual({ ok: true });
    expect(prisma.incomeSource.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
