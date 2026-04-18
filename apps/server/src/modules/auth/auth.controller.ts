import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
      'Validates Telegram initData, creates user if not exists, creates session and returns session token.',
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
  async telegramAuth(@Body() dto: TelegramAuthDto) {
    return this.authService.telegramAuth(dto.initData);
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
