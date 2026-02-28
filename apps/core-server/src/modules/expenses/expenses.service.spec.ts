import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExpensesService', () => {
  let service: ExpensesService;
  const mockPrisma = {
    expense: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    movement: { create: jest.fn(), deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ExpensesService);
  });

  describe('findAll', () => {
    it('should return expenses', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([{ id: '1', name: 'Rent' }]);
      const result = await service.findAll('user-1', {});
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-1', 'id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create expense and movement', async () => {
      mockPrisma.expense.create.mockResolvedValue({ id: 'e1' });
      mockPrisma.movement.create.mockResolvedValue({});
      await service.create('user-1', {
        name: 'Rent',
        amount: 5000,
        currency: 'RUB',
        periodicity: 'monthly',
      });
      expect(mockPrisma.expense.create).toHaveBeenCalled();
      expect(mockPrisma.movement.create).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete expense and movements', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.movement.deleteMany.mockResolvedValue({});
      mockPrisma.expense.delete.mockResolvedValue({});
      await service.remove('user-1', '1');
      expect(mockPrisma.movement.deleteMany).toHaveBeenCalledWith({ where: { expenseId: '1' } });
      expect(mockPrisma.expense.delete).toHaveBeenCalled();
    });
  });
});
