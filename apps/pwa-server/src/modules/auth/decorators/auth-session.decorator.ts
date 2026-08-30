import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_SESSION_KEY, AuthSessionPayload } from '../guards/session.guard';

export const AuthSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSessionPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { [AUTH_SESSION_KEY]: AuthSessionPayload }>();
    return req[AUTH_SESSION_KEY];
  },
);
