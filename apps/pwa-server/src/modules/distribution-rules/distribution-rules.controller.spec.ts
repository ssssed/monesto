import { DistributionRulesController } from './distribution-rules.controller';
import { DistributionRulesService } from './distribution-rules.service';

describe('DistributionRulesController', () => {
  let service: jest.Mocked<DistributionRulesService>;
  let controller: DistributionRulesController;
  const session = { sessionId: 's', userId: 1 };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<DistributionRulesService>;
    controller = new DistributionRulesController(service);
  });

  it('findAll scopes to session.userId', () => {
    controller.findAll(session);
    expect(service.findAll).toHaveBeenCalledWith(1);
  });

  it('create passes dto and userId', () => {
    const dto = {} as any;
    controller.create(dto, session);
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });

  it('remove passes id and userId', () => {
    controller.remove(5, session);
    expect(service.remove).toHaveBeenCalledWith(5, 1);
  });
});
