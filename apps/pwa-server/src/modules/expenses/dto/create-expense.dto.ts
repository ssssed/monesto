import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoneyFlowCurrency, Recurrence } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Аренда' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: MoneyFlowCurrency, enumName: 'MoneyFlowCurrency' })
  @IsEnum(MoneyFlowCurrency)
  currency!: MoneyFlowCurrency;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: Recurrence, enumName: 'Recurrence' })
  @IsEnum(Recurrence)
  recurrence!: Recurrence;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @ApiPropertyOptional({
    example: null,
    description: 'id актива-кредита, если это платёж по кредиту',
  })
  @IsOptional()
  @IsInt()
  linkedAssetId?: number;
}
