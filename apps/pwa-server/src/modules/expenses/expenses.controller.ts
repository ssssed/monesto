import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthSession } from '../auth/decorators/auth-session.decorator';
import type { AuthSessionPayload } from '../auth/guards/session.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@Auth()
@ApiBearerAuth('session')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Список расходов пользователя' })
  findAll(@AuthSession() session: AuthSessionPayload) {
    return this.service.findAll(session.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Расход по id' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.findOne(id, session.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать расход' })
  create(
    @Body() dto: CreateExpenseDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.create(dto, session.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить расход' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.update(id, dto, session.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить расход' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.remove(id, session.userId);
  }
}
