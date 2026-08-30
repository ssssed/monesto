import { Body, Controller, Headers, Post, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { AuthSession } from './decorators/auth-session.decorator';
import { RequestEmailCodeDto } from './dto/request-email-code.dto';
import {
  SessionResponseDto,
  UserResponseDto,
} from './dto/session-response.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import type { AuthSessionPayload } from './guards/session.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/request-code')
  @ApiOperation({
    summary: 'Отправить код подтверждения на email (регистрация и вход)',
  })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  requestEmailCode(@Body() dto: RequestEmailCodeDto) {
    return this.authService.requestEmailCode(dto.email);
  }

  @Post('email/verify-code')
  @ApiOperation({
    summary: 'Проверить код и войти (создаёт пользователя при первом входе)',
  })
  @ApiOkResponse({ type: SessionResponseDto })
  verifyEmailCode(
    @Body() dto: VerifyEmailCodeDto,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    return this.authService.verifyEmailCode(dto.email, dto.code, userAgent);
  }

  @Post('telegram')
  @ApiOperation({
    summary: 'Войти через Telegram Login Widget',
  })
  @ApiOkResponse({ type: SessionResponseDto })
  telegramAuth(
    @Body() dto: TelegramAuthDto,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    return this.authService.telegramAuth(dto, userAgent);
  }

  @Auth()
  @ApiBearerAuth('session')
  @Get('me')
  @ApiOperation({ summary: 'Текущий пользователь' })
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@AuthSession() session: AuthSessionPayload) {
    return this.authService.getMe(session.userId);
  }

  @Auth()
  @ApiBearerAuth('session')
  @Post('logout')
  @ApiOperation({ summary: 'Выйти (удалить текущую сессию)' })
  logout(@AuthSession() session: AuthSessionPayload) {
    return this.authService.logout(session.sessionId, session.userId);
  }

  @Auth()
  @ApiBearerAuth('session')
  @Post('logout-all')
  @ApiOperation({ summary: 'Выйти на всех устройствах' })
  logoutAll(@AuthSession() session: AuthSessionPayload) {
    return this.authService.logoutAll(session.userId);
  }
}
