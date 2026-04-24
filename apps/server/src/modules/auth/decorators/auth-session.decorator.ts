import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import {
  AUTH_SESSION_KEY,
  type AuthSessionPayload,
} from '../guards/session.guard';

/** Payload сессии, выставленный `SessionGuard` после проверки Bearer-токена. */
export const AuthSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSessionPayload => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const payload = (
      req as Request & { [AUTH_SESSION_KEY]?: AuthSessionPayload }
    )[AUTH_SESSION_KEY];
    if (!payload) {
      throw new Error(
        'AuthSession: отсутствует payload — проверьте порядок guards',
      );
    }
    return payload;
  },
);
