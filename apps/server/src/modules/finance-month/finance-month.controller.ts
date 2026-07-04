import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthSession } from '../auth/decorators/auth-session.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import type { AuthSessionPayload } from '../auth/guards/session.guard';
import { GetMonthFinanceQueryDto } from './dto/get-month-finance-query.dto';
import { MonthFinanceResponseDto } from './dto/month-finance-response.dto';
import { PatchMonthFinanceDto } from './dto/patch-month-finance.dto';
import { FinanceMonthService } from './finance-month.service';

@ApiTags('finance-month')
@Auth()
@ApiBearerAuth('session')
@Controller('finance/month')
export class FinanceMonthController {
  constructor(private readonly financeMonthService: FinanceMonthService) {}

  @Get()
  @ApiOperation({
    summary: 'Состояние заполнения финансов за месяц',
    description:
      'Возвращает статус empty | partial | complete и данные по шагам incoming и mandatory. Если месяц заполнен частично — отдаёт уже сохранённые значения.',
  })
  @ApiOkResponse({ type: MonthFinanceResponseDto })
  @ApiUnauthorizedResponse({ description: 'Нет или невалидный токен сессии' })
  getMonth(
    @AuthSession() session: AuthSessionPayload,
    @Query() query: GetMonthFinanceQueryDto,
  ) {
    return this.financeMonthService.getMonth(
      session.userId,
      query.year,
      query.month,
    );
  }

  @Patch()
  @ApiOperation({
    summary: 'Сохранить данные шага многошаговой формы',
    description:
      'PATCH по шагу: incoming — общий доход (name = null); mandatory — либо общая сумма, либо детализация по breakdown (без дублей с aggregate).',
  })
  @ApiOkResponse({
    description: 'Актуальное состояние месяца после сохранения',
    type: MonthFinanceResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Невалидные данные шага' })
  @ApiUnauthorizedResponse({ description: 'Нет или невалидный токен сессии' })
  patchMonth(
    @AuthSession() session: AuthSessionPayload,
    @Body() dto: PatchMonthFinanceDto,
    @Query() query: GetMonthFinanceQueryDto,
  ) {
    return this.financeMonthService.patchMonth(
      session.userId,
      dto,
      query.year,
      query.month,
    );
  }
}
