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
import { DistributionRulesService } from './distribution-rules.service';
import { CreateDistributionRuleDto } from './dto/create-distribution-rule.dto';
import { UpdateDistributionRuleDto } from './dto/update-distribution-rule.dto';

@ApiTags('distribution-rules')
@Auth()
@ApiBearerAuth('session')
@Controller('distribution-rules')
export class DistributionRulesController {
  constructor(private readonly service: DistributionRulesService) {}

  @Get()
  @ApiOperation({ summary: 'Список правил распределения пользователя' })
  findAll(@AuthSession() session: AuthSessionPayload) {
    return this.service.findAll(session.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Правило распределения по id' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.findOne(id, session.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать правило распределения' })
  create(
    @Body() dto: CreateDistributionRuleDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.create(dto, session.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить правило распределения' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDistributionRuleDto,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.update(id, dto, session.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить правило распределения' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @AuthSession() session: AuthSessionPayload,
  ) {
    return this.service.remove(id, session.userId);
  }
}
