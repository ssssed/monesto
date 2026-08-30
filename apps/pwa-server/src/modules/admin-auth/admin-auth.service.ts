import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_ADMIN_SESSION_TTL_MS } from './admin-auth.constants';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const ttlMs = Number(
      this.config.get<string>('ADMIN_SESSION_TTL_MS') ??
        DEFAULT_ADMIN_SESSION_TTL_MS,
    );
    const session = await this.prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });

    return {
      admin: { id: admin.id, email: admin.email },
      sessionToken: session.token,
    };
  }

  async getMe(adminId: number) {
    const admin = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: adminId },
    });
    return { admin: { id: admin.id, email: admin.email } };
  }

  async logout(sessionId: string, adminId: number) {
    await this.prisma.adminSession.deleteMany({
      where: { id: sessionId, adminId },
    });
    return { ok: true as const };
  }
}
