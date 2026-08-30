import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

describe('AssetsController', () => {
  let service: jest.Mocked<AssetsService>;
  let controller: AssetsController;
  const session = { sessionId: 's', userId: 1 };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getTransactions: jest.fn(),
      createTransaction: jest.fn(),
    } as unknown as jest.Mocked<AssetsService>;
    controller = new AssetsController(service);
  });

  it('findAll scopes to session.userId', () => {
    controller.findAll(session);
    expect(service.findAll).toHaveBeenCalledWith(1);
  });

  it('getTransactions passes asset id and userId', () => {
    controller.getTransactions(5, session);
    expect(service.getTransactions).toHaveBeenCalledWith(5, 1);
  });

  it('createTransaction passes asset id, userId and dto', () => {
    const dto = { amountDelta: 100 };
    controller.createTransaction(5, dto, session);
    expect(service.createTransaction).toHaveBeenCalledWith(5, 1, dto);
  });

  it('remove passes id and userId', () => {
    controller.remove(5, session);
    expect(service.remove).toHaveBeenCalledWith(5, 1);
  });
});
