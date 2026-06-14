import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthSession } from '../auth/decorators/auth-session.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import type { AuthSessionPayload } from '../auth/guards/session.guard';
import { AllocationRulesService } from './allocation-rules.service';
import { AllocationRuleResponseDto } from './dto/allocation-rule-response.dto';
import { CreateAllocationRuleDto } from './dto/create-allocation-rule.dto';

@ApiTags('allocation-rules')
@Auth()
@ApiBearerAuth('session')
@Controller('allocation-rules')
export class AllocationRulesController {
  constructor(
    private readonly allocationRulesService: AllocationRulesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Список правил авто-распределения пользователя',
    description:
      'Возвращает правила с активом (название и иконка), датой выполнения, типом пополнения и значением.',
  })
  @ApiOkResponse({
    description: 'Список правил авто-распределения',
    type: AllocationRuleResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Нет или невалидный токен сессии' })
  findAll(@AuthSession() session: AuthSessionPayload) {
    return this.allocationRulesService.findAll(session.userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Создать правило авто-распределения',
    description:
      'Пользователь выбирает актив (по slug), тип пополнения (percent, fixed_amount, quantity), значение и дату выполнения.',
  })
  @ApiCreatedResponse({
    description: 'Созданное правило',
    type: AllocationRuleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Невалидные данные запроса' })
  @ApiNotFoundResponse({ description: 'Актив не найден' })
  @ApiUnauthorizedResponse({ description: 'Нет или невалидный токен сессии' })
  create(
    @AuthSession() session: AuthSessionPayload,
    @Body() dto: CreateAllocationRuleDto,
  ) {
    return this.allocationRulesService.create(session.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Удалить правило авто-распределения' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор правила',
    example: 1,
  })
  @ApiNoContentResponse({ description: 'Правило удалено' })
  @ApiNotFoundResponse({ description: 'Правило не найдено' })
  @ApiUnauthorizedResponse({ description: 'Нет или невалидный токен сессии' })
  async remove(
    @AuthSession() session: AuthSessionPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.allocationRulesService.remove(session.userId, id);
  }
}
