import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthSession } from '../auth/decorators/auth-session.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import type { AuthSessionPayload } from '../auth/guards/session.guard';
import { UpdateBaseCurrencyDto } from './dto/update-base-currency.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Auth()
@ApiBearerAuth('session')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Patch('base-currency')
  @ApiOperation({ summary: 'Изменить базовую валюту пользователя' })
  updateBaseCurrency(
    @AuthSession() session: AuthSessionPayload,
    @Body() dto: UpdateBaseCurrencyDto,
  ) {
    return this.settingsService.updateBaseCurrency(
      session.userId,
      dto.baseCurrency,
    );
  }

  @Post('clear-assets-portfolio')
  @ApiOperation({
    summary:
      'Очистить портфель: удалить все активы, историю транзакций по ним и позиции',
  })
  clearAssetsPortfolio(@AuthSession() session: AuthSessionPayload) {
    return this.settingsService.clearAssetsPortfolio(session.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить настройки пользователя' })
  getUserSettings(@AuthSession() session: AuthSessionPayload) {
    return this.settingsService.getUserSettings(session.userId);
  }
}
