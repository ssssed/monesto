import { applyDecorators, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../guards/session.guard';

/**
 * Только для клиентов с валидной сессией (`Authorization: Bearer <token>`).
 * Можно вешать на класс контроллера или на отдельный метод.
 */
export function Auth() {
  return applyDecorators(UseGuards(SessionGuard));
}
