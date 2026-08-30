import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ADMIN_AUTH_SESSION_KEY,
  AdminSessionGuard,
} from './admin-session.guard';

function makeContext(authorization?: string) {
  const req: any = { headers: { authorization } };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as unknown as ExecutionContext & { _req: typeof req };
}

describe('AdminSessionGuard', () => {
  let prisma: { adminSession: { findFirst: jest.Mock } };
  let guard: AdminSessionGuard;

  beforeEach(() => {
    prisma = { adminSession: { findFirst: jest.fn() } };
    guard = new AdminSessionGuard(prisma as unknown as PrismaService);
  });

  it('rejects missing Authorization header', async () => {
    await expect(guard.canActivate(makeContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unknown/expired token', async () => {
    prisma.adminSession.findFirst.mockResolvedValue(null);
    await expect(guard.canActivate(makeContext('Bearer bad'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('attaches adminId/sessionId for a valid token', async () => {
    prisma.adminSession.findFirst.mockResolvedValue({
      id: 'admin-session-1',
      adminId: 3,
    });
    const ctx = makeContext('Bearer good');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx._req[ADMIN_AUTH_SESSION_KEY]).toEqual({
      sessionId: 'admin-session-1',
      adminId: 3,
    });
  });
});
