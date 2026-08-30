import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuth } from './decorators/admin-auth.decorator';
import { AdminAuthSession } from './decorators/admin-auth-session.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminSessionResponseDto } from './dto/admin-session-response.dto';
import type { AdminAuthSessionPayload } from './guards/admin-session.guard';

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход администратора (email + пароль)' })
  @ApiOkResponse({ type: AdminSessionResponseDto })
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto.email, dto.password);
  }

  @AdminAuth()
  @ApiBearerAuth('admin-session')
  @Get('me')
  @ApiOperation({ summary: 'Текущий администратор' })
  getMe(@AdminAuthSession() session: AdminAuthSessionPayload) {
    return this.adminAuthService.getMe(session.adminId);
  }

  @AdminAuth()
  @ApiBearerAuth('admin-session')
  @Post('logout')
  @ApiOperation({ summary: 'Выйти из админки' })
  logout(@AdminAuthSession() session: AdminAuthSessionPayload) {
    return this.adminAuthService.logout(session.sessionId, session.adminId);
  }
}
