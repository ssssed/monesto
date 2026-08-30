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
import { CreateVacationPeriodDto } from './dto/create-vacation-period.dto';
import { UpdateVacationPeriodDto } from './dto/update-vacation-period.dto';
import { VacationPeriodsService } from './vacation-periods.service';

@ApiTags('vacation-periods')
@Auth()
@ApiBearerAuth('session')
@Controller('vacation-periods')
export class VacationPeriodsController {
  constructor(private readonly service: VacationPeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'Список периодов отпуска пользователя' })
  findAll(@AuthSession() session: AuthSessionPayload) {
    return this.service.findAll(session.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Период отпуска по id' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.findOne(id, session.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать период отпуска' })
  create(
    @Body() dto: CreateVacationPeriodDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.create(dto, session.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить период отпуска' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVacationPeriodDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.update(id, dto, session.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить период отпуска' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.remove(id, session.userId);
  }
}
