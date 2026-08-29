import { IncomeSourcesController } from './income-sources.controller';
import { IncomeSourcesService } from './income-sources.service';

describe('IncomeSourcesController', () => {
  let service: jest.Mocked<IncomeSourcesService>;
  let controller: IncomeSourcesController;
  const session = { sessionId: 's', userId: 1 };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<IncomeSourcesService>;
    controller = new IncomeSourcesController(service);
  });

  it('findAll scopes to session.userId', () => {
    controller.findAll(session);
    expect(service.findAll).toHaveBeenCalledWith(1);
  });

  it('findOne passes id and userId', () => {
    controller.findOne(5, session);
    expect(service.findOne).toHaveBeenCalledWith(5, 1);
  });

  it('create passes dto and userId', () => {
    const dto = {} as any;
    controller.create(dto, session);
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });

  it('update passes id, dto and userId', () => {
    const dto = { name: 'X' } as any;
    controller.update(5, dto, session);
    expect(service.update).toHaveBeenCalledWith(5, dto, 1);
  });

  it('remove passes id and userId', () => {
    controller.remove(5, session);
    expect(service.remove).toHaveBeenCalledWith(5, 1);
  });
});
