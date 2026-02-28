import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { PutLayoutDtoSchema } from './dto/dashboard.dto';
import { ZodValidationPipe } from '../shared/pipes/zod-validation.pipe';
import { swaggerSchemas } from '../../common/swagger-schemas';

@ApiTags('dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('layout')
  @ApiOperation({ summary: 'Получить layout дашборда' })
  @ApiResponse({ status: 200, description: 'Сохранённый layout', schema: swaggerSchemas.LayoutResponse })
  @ApiResponse({ status: 401, description: 'Не авторизован', schema: swaggerSchemas.ErrorResponse })
  getLayout(@CurrentUser() user: User) {
    return this.dashboardService.getLayout(user.id);
  }

  @Put('layout')
  @ApiOperation({ summary: 'Сохранить layout дашборда' })
  @ApiBody({ schema: swaggerSchemas.PutLayoutBody })
  @ApiResponse({ status: 200, description: 'Сохранено', schema: swaggerSchemas.OkResponse })
  @ApiResponse({ status: 401, description: 'Не авторизован', schema: swaggerSchemas.ErrorResponse })
  putLayout(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(PutLayoutDtoSchema)) body: { widgets: Array<{ id: string; widgetType: string; position?: number; order?: number }> },
  ) {
    return this.dashboardService.putLayout(user.id, body);
  }

  @Get('widget/:widgetType')
  @ApiOperation({ summary: 'Данные для виджета', description: 'Query: month, year. Для asset-chart: accountId, tag.' })
  @ApiParam({ name: 'widgetType', enum: ['income', 'expenses', 'balance', 'free-money', 'asset-chart'] })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'accountId', required: false, description: 'Для asset-chart' })
  @ApiQuery({ name: 'tag', required: false, description: 'Для asset-chart' })
  @ApiResponse({ status: 200, description: 'component + data для отрисовки виджета', schema: swaggerSchemas.WidgetDataResponse })
  @ApiResponse({ status: 401, description: 'Не авторизован', schema: swaggerSchemas.ErrorResponse })
  getWidget(
    @CurrentUser() user: User,
    @Param('widgetType') widgetType: string,
    @Query() query: { year?: string; month?: string; accountId?: string; tag?: string },
  ) {
    return this.dashboardService.getWidgetData(user, widgetType, query);
  }
}
