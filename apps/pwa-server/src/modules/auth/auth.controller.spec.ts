import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let service: jest.Mocked<AuthService>;
  let controller: AuthController;

  beforeEach(() => {
    service = {
      requestEmailCode: jest.fn(),
      verifyEmailCode: jest.fn(),
      telegramAuth: jest.fn(),
      getMe: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    controller = new AuthController(service);
  });

  it('requestEmailCode delegates to the service', () => {
    controller.requestEmailCode({ email: 'a@b.com' });
    expect(service.requestEmailCode).toHaveBeenCalledWith('a@b.com');
  });

  it('verifyEmailCode delegates to the service with the user-agent header', () => {
    controller.verifyEmailCode({ email: 'a@b.com', code: '123456' }, 'ua');
    expect(service.verifyEmailCode).toHaveBeenCalledWith(
      'a@b.com',
      '123456',
      'ua',
    );
  });

  it('telegramAuth delegates to the service', () => {
    const dto = {
      id: 1,
      first_name: 'Ada',
      auth_date: 1,
      hash: 'x',
    };
    controller.telegramAuth(dto, 'ua');
    expect(service.telegramAuth).toHaveBeenCalledWith(dto, 'ua');
  });

  it('getMe reads userId from the session payload', () => {
    controller.getMe({ sessionId: 's1', userId: 7 });
    expect(service.getMe).toHaveBeenCalledWith(7);
  });

  it('logout uses both sessionId and userId', () => {
    controller.logout({ sessionId: 's1', userId: 7 });
    expect(service.logout).toHaveBeenCalledWith('s1', 7);
  });

  it('logoutAll uses userId only', () => {
    controller.logoutAll({ sessionId: 's1', userId: 7 });
    expect(service.logoutAll).toHaveBeenCalledWith(7);
  });
});
