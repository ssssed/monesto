import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { CreateExpenseDtoSchema, UpdateExpenseDtoSchema } from './dto/expenses.dto';
import { ZodValidationPipe } from '../shared/pipes/zod-validation.pipe';
import { swaggerSchemas } from '../../common/swagger-schemas';

@ApiTags('expenses')
@ApiBearerAuth('JWT')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Список расходов' })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findAll(@CurrentUser() user: User, @Query('year') year?: string, @Query('month') month?: string) {
    return this.expensesService.findAll(user.id, {
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Расход' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.expensesService.findOne(user.id, id);
  }

  @Post()
  @ApiBody({ schema: swaggerSchemas.CreateExpenseBody })
  @ApiResponse({ status: 201, description: 'Созданный расход' })
  @ApiResponse({ status: 400, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateExpenseDtoSchema)) body: {
      name: string;
      amount: number;
      currency: string;
      periodicity: 'on_advance' | 'on_salary' | 'monthly';
    },
  ) {
    return this.expensesService.create(user.id, body);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ schema: swaggerSchemas.UpdateExpenseBody })
  @ApiResponse({ status: 200, description: 'Обновлённый расход' })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateExpenseDtoSchema)) body: {
      name?: string;
      amount?: number;
      currency?: string;
      periodicity?: 'on_advance' | 'on_salary' | 'monthly';
    },
  ) {
    return this.expensesService.update(user.id, id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, schema: swaggerSchemas.OkResponse })
  @ApiResponse({ status: 404, schema: swaggerSchemas.ErrorResponse })
  @ApiResponse({ status: 401, schema: swaggerSchemas.ErrorResponse })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.expensesService.remove(user.id, id);
  }
}
