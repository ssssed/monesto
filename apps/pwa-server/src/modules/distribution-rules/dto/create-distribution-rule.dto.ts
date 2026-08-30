import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditEarlyRepayMode, RuleCurrency, RuleType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDistributionRuleDto {
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
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    enum: CreditEarlyRepayMode,
    enumName: 'CreditEarlyRepayMode',
  })
  @IsOptional()
  @IsEnum(CreditEarlyRepayMode)
  creditEarlyRepayMode?: CreditEarlyRepayMode;
}
