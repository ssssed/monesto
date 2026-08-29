import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditEarlyRepayMode, RuleCurrency, RuleType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class DraftRulesBudgetDto {
  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional()
  @IsDateString()
  today?: string;

  @ApiPropertyOptional({
    example: 3,
    description:
      'id редактируемого правила — заменяет его в списке вместо добавления нового',
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'Отложить на подушку' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: RuleType, enumName: 'RuleType' })
  @IsEnum(RuleType)
  ruleType!: RuleType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  value!: number;

  @ApiProperty({ enum: RuleCurrency, enumName: 'RuleCurrency' })
  @IsEnum(RuleCurrency)
  currency!: RuleCurrency;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsInt()
  targetAssetId?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    enum: CreditEarlyRepayMode,
    enumName: 'CreditEarlyRepayMode',
  })
  @IsOptional()
  @IsEnum(CreditEarlyRepayMode)
  creditEarlyRepayMode?: CreditEarlyRepayMode;
}
