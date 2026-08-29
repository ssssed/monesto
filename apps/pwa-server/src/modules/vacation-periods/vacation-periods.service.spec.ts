import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VacationPeriodsService } from './vacation-periods.service';

describe('VacationPeriodsService', () => {
  let prisma: any;
  let service: VacationPeriodsService;

  beforeEach(() => {
    prisma = {
      vacationPeriod: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new VacationPeriodsService(prisma as unknown as PrismaService);
  });

  it('findAll scopes the query to userId', async () => {
    prisma.vacationPeriod.findMany.mockResolvedValue([]);
    await service.findAll(1);
    expect(prisma.vacationPeriod.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { startDate: 'asc' },
    });
  });

  it("findOne throws NotFoundException for another user's period", async () => {
    prisma.vacationPeriod.findFirst.mockResolvedValue(null);
    await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
  });

  it('create stores dates parsed from ISO strings, scoped to userId', async () => {
    prisma.vacationPeriod.create.mockResolvedValue({ id: 1 });
    await service.create({ startDate: '2026-07-01', endDate: '2026-07-14' }, 1);
    expect(prisma.vacationPeriod.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-14'),
      },
    });
  });

  it('update throws NotFoundException when the row belongs to another user', async () => {
    prisma.vacationPeriod.findFirst.mockResolvedValue(null);
    await expect(
      service.update(1, { startDate: '2026-08-01' }, 999),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.vacationPeriod.update).not.toHaveBeenCalled();
  });

  it('update patches only the provided fields for the owner', async () => {
    prisma.vacationPeriod.findFirst.mockResolvedValue({ id: 1, userId: 1 });
    prisma.vacationPeriod.update.mockResolvedValue({ id: 1 });
    await service.update(1, { startDate: '2026-08-01' }, 1);
    expect(prisma.vacationPeriod.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { startDate: new Date('2026-08-01'), endDate: undefined },
    });
  });

  it("remove throws NotFoundException for another user's period", async () => {
    prisma.vacationPeriod.findFirst.mockResolvedValue(null);
    await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
    expect(prisma.vacationPeriod.delete).not.toHaveBeenCalled();
  });

  it('remove deletes the row when owned by the caller', async () => {
    prisma.vacationPeriod.findFirst.mockResolvedValue({ id: 1, userId: 1 });
    await expect(service.remove(1, 1)).resolves.toEqual({ ok: true });
    expect(prisma.vacationPeriod.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
