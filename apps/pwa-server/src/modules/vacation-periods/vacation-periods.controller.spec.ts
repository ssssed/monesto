import { VacationPeriodsController } from './vacation-periods.controller';
import { VacationPeriodsService } from './vacation-periods.service';

describe('VacationPeriodsController', () => {
  let service: jest.Mocked<VacationPeriodsService>;
  let controller: VacationPeriodsController;
  const session = { sessionId: 's', userId: 1 };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<VacationPeriodsService>;
    controller = new VacationPeriodsController(service);
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
    const dto = { startDate: '2026-07-01', endDate: '2026-07-14' };
    controller.create(dto, session);
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });

  it('update passes id, dto and userId', () => {
    controller.update(5, { startDate: '2026-08-01' }, session);
    expect(service.update).toHaveBeenCalledWith(
      5,
      { startDate: '2026-08-01' },
      1,
    );
  });

  it('remove passes id and userId', () => {
    controller.remove(5, session);
    expect(service.remove).toHaveBeenCalledWith(5, 1);
  });
});
