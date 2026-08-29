import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let service: jest.Mocked<UsersService>;
  let controller: UsersController;

  beforeEach(() => {
    service = {
      getMe: jest.fn(),
      updateSettings: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;
    controller = new UsersController(service);
  });

  it('getMe delegates to the service with userId', () => {
    controller.getMe({ sessionId: 's', userId: 3 });
    expect(service.getMe).toHaveBeenCalledWith(3);
  });

  it('updateSettings delegates to the service with userId and dto', () => {
    controller.updateSettings(
      { sessionId: 's', userId: 3 },
      {
        baseCurrency: 'usd' as any,
      },
    );
    expect(service.updateSettings).toHaveBeenCalledWith(3, {
      baseCurrency: 'usd',
    });
  });
});
