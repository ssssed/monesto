import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('IncomesService', () => {
  let service: IncomesService;
  const mockPrisma = {
    incomeType: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    income: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    movement: { create: jest.fn(), deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(IncomesService);
  });

  describe('getIncomeTypes', () => {
    it('should return income types', async () => {
      mockPrisma.incomeType.findMany.mockResolvedValue([{ id: '1', name: 'Salary' }]);
      const result = await service.getIncomeTypes('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getIncomeType', () => {
    it('should throw if not found', async () => {
      mockPrisma.incomeType.findFirst.mockResolvedValue(null);
      await expect(service.getIncomeType('user-1', 'id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createIncome', () => {
    it('should create income and movement', async () => {
      mockPrisma.income.create.mockResolvedValue({ id: 'i1', amount: 100, year: 2025, month: 2 });
      mockPrisma.movement.create.mockResolvedValue({});
      await service.createIncome('user-1', {
        incomeTypeId: 'it1',
        amount: 100,
        currency: 'RUB',
        year: 2025,
        month: 2,
      });
      expect(mockPrisma.income.create).toHaveBeenCalled();
      expect(mockPrisma.movement.create).toHaveBeenCalled();
    });
  });
});
