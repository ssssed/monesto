import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: 'Аренда' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    enum: MoneyFlowCurrency,
    enumName: 'MoneyFlowCurrency',
  })
  @IsOptional()
  @IsEnum(MoneyFlowCurrency)
  currency?: MoneyFlowCurrency;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ enum: Recurrence, enumName: 'Recurrence' })
  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence;

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

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsInt()
  linkedAssetId?: number;
}
