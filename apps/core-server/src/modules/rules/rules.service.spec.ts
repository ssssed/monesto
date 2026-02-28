import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RulesService } from './rules.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RulesService', () => {
  let service: RulesService;
  const mockRule = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  };
  const mockRuleStep = { create: jest.fn(), deleteMany: jest.fn() };
  const mockPrisma = {
    rule: mockRule,
    ruleStep: mockRuleStep,
    $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) => cb({ rule: mockRule, ruleStep: mockRuleStep })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(RulesService);
  });

  describe('findAll', () => {
    it('should return rules with steps', async () => {
      mockPrisma.rule.findMany.mockResolvedValue([{ id: '1', steps: [] }]);
      const result = await service.findAll('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockPrisma.rule.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-1', 'id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create rule and steps', async () => {
      mockPrisma.rule.create.mockResolvedValue({ id: 'r1' });
      mockPrisma.rule.findFirst.mockResolvedValue({ id: 'r1', steps: [], incomeType: {} });
      mockPrisma.ruleStep.create.mockResolvedValue({});
      await service.create('user-1', {
        triggerIncomeTypeId: 'it1',
        showOnDashboard: false,
        order: 0,
        steps: [{ order: 0, actionType: 'take_percent', params: { percent: 10 } }],
      });
      expect(mockPrisma.rule.create).toHaveBeenCalled();
      expect(mockPrisma.ruleStep.create).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete rule', async () => {
      mockPrisma.rule.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.rule.delete.mockResolvedValue({});
      await service.remove('user-1', '1');
      expect(mockPrisma.rule.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
