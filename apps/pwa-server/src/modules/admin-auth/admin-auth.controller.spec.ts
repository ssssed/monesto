import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthController', () => {
  let service: jest.Mocked<AdminAuthService>;
  let controller: AdminAuthController;

  beforeEach(() => {
    service = {
      login: jest.fn(),
      getMe: jest.fn(),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AdminAuthService>;
    controller = new AdminAuthController(service);
  });

  it('login delegates email/password to the service', () => {
    controller.login({ email: 'a@b.com', password: 'password123' });
    expect(service.login).toHaveBeenCalledWith('a@b.com', 'password123');
  });

  it('getMe reads adminId from the session', () => {
    controller.getMe({ sessionId: 's', adminId: 9 });
    expect(service.getMe).toHaveBeenCalledWith(9);
  });

  it('logout reads sessionId and adminId from the session', () => {
    controller.logout({ sessionId: 's', adminId: 9 });
    expect(service.logout).toHaveBeenCalledWith('s', 9);
  });
});
