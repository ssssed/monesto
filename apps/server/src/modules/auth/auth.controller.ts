import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

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
  me() {}

  @Auth()
  @Post('/logout')
  logout() {}

  @Auth()
  @Post('/logout/all')
  logoutAll() {}
}
