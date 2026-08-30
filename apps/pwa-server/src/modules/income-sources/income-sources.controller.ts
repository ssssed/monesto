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
import { CreateIncomeSourceDto } from './dto/create-income-source.dto';
import { UpdateIncomeSourceDto } from './dto/update-income-source.dto';
import { IncomeSourcesService } from './income-sources.service';

@ApiTags('income-sources')
@Auth()
@ApiBearerAuth('session')
@Controller('income-sources')
export class IncomeSourcesController {
  constructor(private readonly service: IncomeSourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Список источников дохода пользователя' })
  findAll(@AuthSession() session: AuthSessionPayload) {
    return this.service.findAll(session.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Источник дохода по id' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.findOne(id, session.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать источник дохода' })
  create(
    @Body() dto: CreateIncomeSourceDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.create(dto, session.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить источник дохода' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeSourceDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.update(id, dto, session.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить источник дохода' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.remove(id, session.userId);
  }
}
