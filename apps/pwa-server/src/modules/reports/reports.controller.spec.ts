import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let service: jest.Mocked<ReportsService>;
  let controller: ReportsController;
  const session = { sessionId: 's', userId: 1 };

  beforeEach(() => {
    service = {
      getCurrentReport: jest.fn(),
      listCycles: jest.fn(),
      getYearSummary: jest.fn(),
      getRulesBudget: jest.fn(),
      getDraftRulesBudget: jest.fn(),
    } as unknown as jest.Mocked<ReportsService>;
    controller = new ReportsController(service);
  });

  it('getCurrent delegates query and userId', () => {
    controller.getCurrent({ today: '2026-07-01' }, session);
    expect(service.getCurrentReport).toHaveBeenCalledWith(1, {
      today: '2026-07-01',
    });
  });

  it('listCycles delegates query and userId', () => {
    controller.listCycles({}, session);
    expect(service.listCycles).toHaveBeenCalledWith(1, {});
  });

  it('getYearSummary delegates query and userId', () => {
    controller.getYearSummary({}, session);
    expect(service.getYearSummary).toHaveBeenCalledWith(1, {});
  });

  it('getRulesBudget delegates query and userId', () => {
    controller.getRulesBudget({ excludeRuleId: 2 }, session);
    expect(service.getRulesBudget).toHaveBeenCalledWith(1, {
      excludeRuleId: 2,
    });
  });

  it('getDraftRulesBudget delegates body and userId', () => {
    const dto = { name: 'Draft' } as any;
    controller.getDraftRulesBudget(dto, session);
    expect(service.getDraftRulesBudget).toHaveBeenCalledWith(1, dto);
  });
});
