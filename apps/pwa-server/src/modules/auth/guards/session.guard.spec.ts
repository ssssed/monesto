import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AUTH_SESSION_KEY, SessionGuard } from './session.guard';

function makeContext(authorization?: string) {
  const req: any = { headers: { authorization } };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as unknown as ExecutionContext & { _req: typeof req };
}

describe('SessionGuard', () => {
  let prisma: { session: { findFirst: jest.Mock } };
  let guard: SessionGuard;

  beforeEach(() => {
    prisma = { session: { findFirst: jest.fn() } };
    guard = new SessionGuard(prisma as unknown as PrismaService);
  });

  it('throws when Authorization header is missing', async () => {
    const ctx = makeContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws when the token does not match any non-expired session', async () => {
    prisma.session.findFirst.mockResolvedValue(null);
    const ctx = makeContext('Bearer bad-token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches sessionId/userId and allows the request through for a valid token', async () => {
    prisma.session.findFirst.mockResolvedValue({
      id: 'session-1',
      userId: 7,
      token: 'good-token',
      expiresAt: new Date(Date.now() + 1000),
    });
    const ctx = makeContext('Bearer good-token');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx._req[AUTH_SESSION_KEY]).toEqual({
      sessionId: 'session-1',
      userId: 7,
    });
    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: { token: 'good-token', expiresAt: { gt: expect.any(Date) } },
    });
  });
});
