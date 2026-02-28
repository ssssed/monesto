import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IncomesService } from './incomes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import {
  CreateIncomeTypeDtoSchema,
  UpdateIncomeTypeDtoSchema,
  CreateIncomeDtoSchema,
  UpdateIncomeDtoSchema,
} from './dto/incomes.dto';
import { ZodValidationPipe } from '../shared/pipes/zod-validation.pipe';
import { swaggerSchemas } from '../../common/swagger-schemas';

@ApiTags('income-types')
@ApiBearerAuth('JWT')
@Controller('income-types')
@UseGuards(JwtAuthGuard)
export class IncomeTypesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Список типов доходов' })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findAll(@CurrentUser() user: User) {
    return this.incomesService.getIncomeTypes(user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Тип дохода' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.incomesService.getIncomeType(user.id, id);
  }

  @Post()
  @ApiBody({ schema: swaggerSchemas.CreateIncomeTypeBody })
  @ApiResponse({ status: 201, description: 'Созданный тип дохода' })
  @ApiResponse({ status: 400, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateIncomeTypeDtoSchema)) body: { name: string; hasTax?: boolean; isRecurring?: boolean },
  ) {
    return this.incomesService.createIncomeType(user.id, body);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ schema: swaggerSchemas.UpdateIncomeTypeBody })
  @ApiResponse({ status: 200, description: 'Обновлённый тип дохода' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIncomeTypeDtoSchema)) body: { name?: string; hasTax?: boolean; isRecurring?: boolean },
  ) {
    return this.incomesService.updateIncomeType(user.id, id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, schema: swaggerSchemas.OkResponse })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.incomesService.deleteIncomeType(user.id, id);
  }
}

@ApiTags('incomes')
@ApiBearerAuth('JWT')
@Controller('incomes')
@UseGuards(JwtAuthGuard)
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Список записей о доходах за период' })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findAll(
    @CurrentUser() user: User,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.incomesService.getIncomes(user.id, {
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Запись о доходе' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.incomesService.getIncome(user.id, id);
  }

  @Post()
  @ApiBody({ schema: swaggerSchemas.CreateIncomeBody })
  @ApiResponse({ status: 201, description: 'Созданная запись о доходе' })
  @ApiResponse({ status: 400, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateIncomeDtoSchema)) body: { incomeTypeId: string; amount: number; currency: string; year: number; month: number },
  ) {
    return this.incomesService.createIncome(user.id, body);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ schema: swaggerSchemas.UpdateIncomeBody })
  @ApiResponse({ status: 200, description: 'Обновлённая запись о доходе' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIncomeDtoSchema)) body: { amount?: number; currency?: string; year?: number; month?: number },
  ) {
    return this.incomesService.updateIncome(user.id, id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, schema: swaggerSchemas.OkResponse })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.incomesService.deleteIncome(user.id, id);
  }
}
