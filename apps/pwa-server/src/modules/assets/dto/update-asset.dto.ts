import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetProvider, CreditEarlyRepayMode } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateAssetDto {
  @ApiPropertyOptional({ example: 'Сбережения' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: AssetProvider, enumName: 'AssetProvider' })
  @IsOptional()
  @IsEnum(AssetProvider)
  provider?: AssetProvider;

  @ApiPropertyOptional({ example: 'Подушка безопасности' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  goalAmount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  currentAmount?: number;

  @ApiPropertyOptional({ example: 'banknote' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#DBEAFE' })
  @IsOptional()
  @IsString()
  bgColor?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  iconColor?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  costBasisRub?: number;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsInt()
  linkedExpenseId?: number;

  @ApiPropertyOptional({ example: 19.9 })
  @IsOptional()
  @IsNumber()
  creditAnnualRate?: number;

  @ApiPropertyOptional({ example: 36 })
  @IsOptional()
  @IsInt()
  creditTermMonths?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  creditStartDate?: string;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  creditRemainingMonths?: number;

  @ApiPropertyOptional({
    enum: CreditEarlyRepayMode,
    enumName: 'CreditEarlyRepayMode',
  })
  @IsOptional()
  @IsEnum(CreditEarlyRepayMode)
  creditEarlyRepayMode?: CreditEarlyRepayMode;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
