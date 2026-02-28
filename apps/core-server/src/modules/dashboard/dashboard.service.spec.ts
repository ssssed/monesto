import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const mockPrisma = {
    dashboardLayout: { findUnique: jest.fn(), upsert: jest.fn() },
    income: { findMany: jest.fn() },
    expense: { findMany: jest.fn() },
    movement: { findMany: jest.fn() },
    account: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  describe('getLayout', () => {
    it('should return default widgets when no layout', async () => {
      mockPrisma.dashboardLayout.findUnique.mockResolvedValue(null);
      const result = await service.getLayout('user-1');
      expect(result.widgets).toEqual([]);
    });
    it('should return saved layout', async () => {
      mockPrisma.dashboardLayout.findUnique.mockResolvedValue({ layoutJson: { widgets: [{ id: '1', widgetType: 'income' }] } });
      const result = await service.getLayout('user-1');
      expect(result.widgets).toHaveLength(1);
      expect((result.widgets[0] as { widgetType: string }).widgetType).toBe('income');
    });
  });

  describe('putLayout', () => {
    it('should upsert layout', async () => {
      mockPrisma.dashboardLayout.upsert.mockResolvedValue({});
      await service.putLayout('user-1', { widgets: [{ id: '1', widgetType: 'income' }] });
      expect(mockPrisma.dashboardLayout.upsert).toHaveBeenCalled();
    });
  });
});
