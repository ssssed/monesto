import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthSession } from './decorators/auth-session.decorator';
import { Auth } from './decorators/auth.decorator';
import { MeResponseDto } from './dto/me-response.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import type { AuthSessionPayload } from './guards/session.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  @ApiOperation({
    summary: 'Authenticate user via Telegram WebApp initData',
    description:
      'Проверяет initData, при необходимости создаёт пользователя. Сессия привязана к классу устройства по User-Agent (одна на пользователя на тип). Токен только в теле ответа — дальше передавать в Authorization: Bearer.',
  })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    schema: {
      example: {
        user: {
          id: 1,
          telegramId: '123456',
          firstName: 'Igor',
          lastName: 'Ivanov',
        },
        sessionToken: 'cuid_session_token',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid Telegram initData',
  })
  async telegramAuth(@Body() dto: TelegramAuthDto, @Req() req: Request) {
    return this.authService.telegramAuth(
      dto.initData,
      req.headers['user-agent'],
    );
  }

  @Auth()
  @Get('/me')
  @ApiBearerAuth('session')
  @ApiOperation({
    summary: 'Текущий пользователь',
    description:
      'Возвращает профиль пользователя по валидной сессии (`Authorization: Bearer <sessionToken>`).',
  })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    type: MeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Нет или невалидный токен сессии' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  me(@AuthSession() session: AuthSessionPayload) {
    return this.authService.getMe(session.userId);
  }

  @Auth()
  @Post('/logout')
  @ApiBearerAuth('session')
  @ApiOperation({
    summary: 'Выход из текущей сессии',
    description:
      'Удаляет сессию, соответствующую переданному `Authorization: Bearer`. Остальные сессии пользователя сохраняются.',
  })
  @ApiResponse({
    status: 204,
    description: 'Сессия завершена (или уже отсутствовала)',
  })
  @ApiResponse({ status: 401, description: 'Нет или невалидный токен сессии' })
  logout(@AuthSession() session: AuthSessionPayload) {
    this.authService.logout(session.sessionId, session.userId);
  }

  @Auth()
  @Post('/logout/all')
  @ApiBearerAuth('session')
  @ApiOperation({
    summary: 'Выход из всех сессий',
    description:
      'Удаляет все сессии пользователя по `userId` из текущего токена. Текущий токен после ответа тоже недействителен.',
  })
  @ApiResponse({
    status: 204,
    description: 'Все сессии пользователя удалены',
  })
  @ApiResponse({ status: 401, description: 'Нет или невалидный токен сессии' })
  logoutAll(@AuthSession() session: AuthSessionPayload) {
    this.authService.logoutAll(session.userId);
  }
}
