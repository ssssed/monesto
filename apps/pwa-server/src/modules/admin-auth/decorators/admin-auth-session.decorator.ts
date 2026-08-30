import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import {
  ADMIN_AUTH_SESSION_KEY,
  AdminAuthSessionPayload,
} from '../guards/admin-session.guard';

export const AdminAuthSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminAuthSessionPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<
        Request & { [ADMIN_AUTH_SESSION_KEY]: AdminAuthSessionPayload }
      >();
    return req[ADMIN_AUTH_SESSION_KEY];
  },
);
