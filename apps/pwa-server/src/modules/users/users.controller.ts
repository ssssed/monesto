import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthSession } from '../auth/decorators/auth-session.decorator';
import type { AuthSessionPayload } from '../auth/guards/session.guard';
import { UserResponseDto } from '../auth/dto/session-response.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Auth()
@ApiBearerAuth('session')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Профиль и настройки текущего пользователя' })
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@AuthSession() session: AuthSessionPayload) {
    return this.usersService.getMe(session.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновить настройки текущего пользователя' })
  @ApiOkResponse({ type: UserResponseDto })
  updateSettings(
    @AuthSession() session: AuthSessionPayload,
    @Body() dto: UpdateUserSettingsDto,
  ) {
    return this.usersService.updateSettings(session.userId, dto);
  }
}
