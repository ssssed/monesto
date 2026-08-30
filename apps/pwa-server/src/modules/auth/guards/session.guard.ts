import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { extractBearer } from '../lib/token';

export const AUTH_SESSION_KEY = 'authSession';

export interface AuthSessionPayload {
  sessionId: string;
  userId: number;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractBearer(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Не авторизован');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Не авторизован');
    }

    const payload: AuthSessionPayload = {
      sessionId: session.id,
      userId: session.userId,
    };
    (req as Request & { [AUTH_SESSION_KEY]: AuthSessionPayload })[
      AUTH_SESSION_KEY
    ] = payload;

    return true;
  }
}
