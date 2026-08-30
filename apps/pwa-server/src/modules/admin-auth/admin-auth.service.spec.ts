import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  let prisma: any;
  let service: AdminAuthService;

  beforeEach(() => {
    prisma = {
      adminUser: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
      adminSession: { create: jest.fn(), deleteMany: jest.fn() },
    };
    const config = { get: () => undefined } as unknown as ConfigService;
    service = new AdminAuthService(prisma as unknown as PrismaService, config);
  });

  describe('login', () => {
    it('throws UnauthorizedException when the admin does not exist', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);
      await expect(service.login('a@b.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException on a wrong password', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
      });
      await expect(service.login('a@b.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('issues a session on a correct password', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
      });
      prisma.adminSession.create.mockResolvedValue({ token: 'admin-token' });

      const result = await service.login('a@b.com', 'correct-password');

      expect(result).toEqual({
        admin: { id: 1, email: 'a@b.com' },
        sessionToken: 'admin-token',
      });
    });
  });

  describe('logout', () => {
    it('deletes only the matching admin session', async () => {
      await service.logout('sess-1', 5);
      expect(prisma.adminSession.deleteMany).toHaveBeenCalledWith({
        where: { id: 'sess-1', adminId: 5 },
      });
    });
  });
});
