import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AccountsService', () => {
  let service: AccountsService;
  const mockPrisma = {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AccountsService);
  });

  describe('findAll', () => {
    it('should return accounts for user', async () => {
      mockPrisma.account.findMany.mockResolvedValue([{ id: '1', name: 'Acc1' }]);
      const result = await service.findAll('user-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' }, include: { tags: true } });
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-1', 'id')).rejects.toThrow(NotFoundException);
    });
    it('should return account', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({ id: '1', name: 'Acc' });
      const result = await service.findOne('user-1', '1');
      expect(result.name).toBe('Acc');
    });
  });

  describe('create', () => {
    it('should create account', async () => {
      mockPrisma.account.create.mockResolvedValue({ id: '1', name: 'Acc', type: 'account', currency: 'RUB' });
      await service.create('user-1', { name: 'Acc', type: 'account', currency: 'RUB' });
      expect(mockPrisma.account.create).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete account', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.account.delete.mockResolvedValue({});
      await service.remove('user-1', '1');
      expect(mockPrisma.account.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
