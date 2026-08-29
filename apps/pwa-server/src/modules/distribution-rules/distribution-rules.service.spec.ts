import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DistributionRulesService } from './distribution-rules.service';

const baseDto = {
  name: 'Отложить на подушку',
  ruleType: 'percent' as const,
  value: 10,
  currency: 'rub' as const,
};

describe('DistributionRulesService', () => {
  let prisma: any;
  let service: DistributionRulesService;

  beforeEach(() => {
    prisma = {
      distributionRule: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      asset: { findFirst: jest.fn() },
    };
    service = new DistributionRulesService(prisma as unknown as PrismaService);
  });

  it('findAll orders by sortOrder', async () => {
    prisma.distributionRule.findMany.mockResolvedValue([]);
    await service.findAll(1);
    expect(prisma.distributionRule.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  });

  it('create rejects a targetAssetId owned by another user', async () => {
    prisma.asset.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ ...baseDto, targetAssetId: 42 }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('create accepts a targetAssetId owned by the caller', async () => {
    prisma.asset.findFirst.mockResolvedValue({ id: 42, userId: 1 });
    prisma.distributionRule.create.mockResolvedValue({ id: 1 });
    await service.create({ ...baseDto, targetAssetId: 42 }, 1);
    expect(prisma.distributionRule.create).toHaveBeenCalled();
  });

  it("update throws NotFoundException for another user's row", async () => {
    prisma.distributionRule.findFirst.mockResolvedValue(null);
    await expect(service.update(1, { value: 20 }, 999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove deletes an owned row', async () => {
    prisma.distributionRule.findFirst.mockResolvedValue({ id: 1, userId: 1 });
    await expect(service.remove(1, 1)).resolves.toEqual({ ok: true });
    expect(prisma.distributionRule.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
