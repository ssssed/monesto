import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { extractBearer } from '../../auth/lib/token';

export const ADMIN_AUTH_SESSION_KEY = 'adminAuthSession';

export interface AdminAuthSessionPayload {
  sessionId: string;
  adminId: number;
}

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractBearer(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Не авторизован');
    }

    const session = await this.prisma.adminSession.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });

    if (!session) {
      throw new UnauthorizedException('Не авторизован');
    }

    const payload: AdminAuthSessionPayload = {
      sessionId: session.id,
      adminId: session.adminId,
    };
    (req as Request & { [ADMIN_AUTH_SESSION_KEY]: AdminAuthSessionPayload })[
      ADMIN_AUTH_SESSION_KEY
    ] = payload;

    return true;
  }
}
