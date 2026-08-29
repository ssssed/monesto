import { applyDecorators, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../guards/session.guard';

/**
 * Требует валидную пользовательскую сессию (`Authorization: Bearer <token>`).
 * Вешается на класс контроллера или на отдельный метод.
 */
export function Auth() {
  return applyDecorators(UseGuards(SessionGuard));
}
