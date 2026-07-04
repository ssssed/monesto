import { ApiProperty } from '@nestjs/swagger';
import { AllocationTopUpType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAllocationRuleDto {
  @ApiProperty({
    example: 'gold-savings',
    description: 'Slug актива, на который настроено авто-распределение',
  })
  @IsString()
  @MaxLength(120)
  assetSlug!: string;

  @ApiProperty({
    enum: AllocationTopUpType,
    enumName: 'AllocationTopUpType',
    example: AllocationTopUpType.percent,
    description:
      'percent — % от дохода, fixed_amount — фиксированная сумма, quantity — количество единиц актива',
  })
  @IsEnum(AllocationTopUpType)
  topUpType!: AllocationTopUpType;

  @ApiProperty({
    example: 15,
    description:
      'Для percent — доля от 0 до 100; для fixed_amount и quantity — положительное число',
  })
  @IsNumber({ maxDecimalPlaces: 6 })
  value!: number;

  @ApiProperty({
    example: '2026-06-15',
    description: 'Дата выполнения правила (ISO 8601, только дата)',
  })
  @IsDateString({ strict: true })
  executionDate!: string;
}
