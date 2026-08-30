import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateDistributionRuleDto {
  @ApiPropertyOptional({ example: 'Отложить на подушку' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: RuleType, enumName: 'RuleType' })
  @IsOptional()
  @IsEnum(RuleType)
  ruleType?: RuleType;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ enum: RuleCurrency, enumName: 'RuleCurrency' })
  @IsOptional()
  @IsEnum(RuleCurrency)
  currency?: RuleCurrency;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsInt()
  targetAssetId?: number;

  @ApiPropertyOptional({ example: 0 })
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
