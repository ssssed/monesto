import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthSession } from '../auth/decorators/auth-session.decorator';
import type { AuthSessionPayload } from '../auth/guards/session.guard';
import { ConfirmRejectAllocationDto } from './dto/confirm-reject-allocation.dto';
import { DraftRulesBudgetDto } from './dto/draft-rules-budget.dto';
import { GetCurrentReportQueryDto } from './dto/get-current-report-query.dto';
import { GetCyclesQueryDto } from './dto/get-cycles-query.dto';
import { GetRulesBudgetQueryDto } from './dto/get-rules-budget-query.dto';
import { GetYearSummaryQueryDto } from './dto/get-year-summary-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Auth()
@ApiBearerAuth('session')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('current')
  @ApiOperation({
    summary:
      'Текущий (или выбранный) цикл отчёта: доходы/расходы/распределение',
  })
  getCurrent(
    @Query() query: GetCurrentReportQueryDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.reportsService.getCurrentReport(session.userId, query);
  }

  @Get('cycles')
  @ApiOperation({ summary: 'Список доступных циклов для переключателя' })
  listCycles(
    @Query() query: GetCyclesQueryDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.reportsService.listCycles(session.userId, query);
  }

  @Get('year-summary')
  @ApiOperation({ summary: 'Итоги года по активам (без учёта кредитов)' })
  getYearSummary(
    @Query() query: GetYearSummaryQueryDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.reportsService.getYearSummary(session.userId, query);
  }

  @Get('rules-budget')
  @ApiOperation({ summary: 'Разбивка % остатка по существующим правилам' })
  getRulesBudget(
    @Query() query: GetRulesBudgetQueryDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.reportsService.getRulesBudget(session.userId, query);
  }

  @Post('rules-budget/draft')
  @ApiOperation({
    summary:
      'Разбивка % остатка с подставленным черновиком правила (создание/правка)',
  })
  getDraftRulesBudget(
    @Body() dto: DraftRulesBudgetDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.reportsService.getDraftRulesBudget(session.userId, dto);
  }

  @Post('allocations/:ruleId/confirm')
  @ApiOperation({
    summary:
      'Подтвердить аллокацию правила на цикл — реально переводит деньги на актив',
  })
  confirmAllocation(
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() dto: ConfirmRejectAllocationDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.reportsService.confirmAllocation(
      session.userId,
      ruleId,
      dto.cycleKey,
    );
  }

  @Post('allocations/:ruleId/reject')
  @ApiOperation({
    summary: 'Отклонить аллокацию правила на цикл (без движения денег)',
  })
  rejectAllocation(
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() dto: ConfirmRejectAllocationDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.reportsService.rejectAllocation(
      session.userId,
      ruleId,
      dto.cycleKey,
    );
  }
}
