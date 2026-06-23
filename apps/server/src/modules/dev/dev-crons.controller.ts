import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AllocationRulesExecutionResultDto } from '../allocation-rules/dto/allocation-rules-execution-result.dto';
import { DevCronsService } from './dev-crons.service';
import { DevOnlyGuard } from './guards/dev-only.guard';

class DevCronsRunResponseDto {
  runAt!: string;
  referenceDate!: string;
  jobs!: {
    allocationRules: AllocationRulesExecutionResultDto;
  };
}

@ApiTags('dev')
@Controller('dev/crons')
@UseGuards(DevOnlyGuard)
export class DevCronsController {
  constructor(private readonly devCronsService: DevCronsService) {}

  @Post('run-today')
  @ApiOperation({
    summary: '[dev] Запустить все ежедневные кроны на текущий день',
    description:
      'Ручной запуск крон, которые обычно срабатывают по расписанию. Доступен только при NODE_ENV !== production. Фильтрует правила распределения по дню месяца текущей даты.',
  })
  @ApiOkResponse({
    description: 'Сводка выполнения крон',
    type: DevCronsRunResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Эндпоинт отключён в production',
  })
  runToday() {
    return this.devCronsService.runAllForToday();
  }
}
