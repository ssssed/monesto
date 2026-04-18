import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

export type RequestWithUser = Request & { user: User };

@Injectable()
export class XUserIdGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const raw = req.headers['x-user-id'];
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (!id) {
      throw new UnauthorizedException('Missing X-User-Id header');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(
        'User not found. X-User-Id must be the `id` field from POST /api/users (cuid), not telegramId.',
      );
    }
    req.user = user;
    return true;
  }
}
