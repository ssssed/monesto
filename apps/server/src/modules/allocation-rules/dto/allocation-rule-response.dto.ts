import { ApiProperty } from '@nestjs/swagger';
import { AllocationTopUpType } from '@prisma/client';
import { AllocationRuleAssetDto } from './allocation-rule-asset.dto';

export class AllocationRuleResponseDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ type: AllocationRuleAssetDto })
  asset!: AllocationRuleAssetDto;

  @ApiProperty({
    example: '2026-06-15',
    description: 'Дата выполнения правила (ISO, только дата)',
  })
  executionDate!: string;

  @ApiProperty({
    enum: AllocationTopUpType,
    enumName: 'AllocationTopUpType',
    example: AllocationTopUpType.percent,
    description:
      'Тип пополнения: percent — % от дохода, fixed_amount — фиксированная сумма, quantity — количество единиц актива',
  })
  topUpType!: AllocationTopUpType;

  @ApiProperty({
    example: 15,
    description:
      'Значение пополнения: доля в %, сумма в базовой валюте или количество (граммы, USD и т.д.)',
  })
  value!: number;
}
