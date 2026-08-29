import { applyDecorators, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from '../guards/admin-session.guard';

/** Требует валидную сессию администратора (`Authorization: Bearer <token>`). */
export function AdminAuth() {
  return applyDecorators(UseGuards(AdminSessionGuard));
}
