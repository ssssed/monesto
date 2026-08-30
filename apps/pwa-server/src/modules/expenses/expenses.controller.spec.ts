import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  let service: jest.Mocked<ExpensesService>;
  let controller: ExpensesController;
  const session = { sessionId: 's', userId: 1 };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<ExpensesService>;
    controller = new ExpensesController(service);
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
