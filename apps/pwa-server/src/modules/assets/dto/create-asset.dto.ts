import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateAssetDto {
  @ApiProperty({ example: 'Сбережения' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: AssetProvider, enumName: 'AssetProvider' })
  @IsEnum(AssetProvider)
  provider!: AssetProvider;

  @ApiPropertyOptional({ example: 'Подушка безопасности' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  goalAmount?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  currentAmount?: number;

  @ApiProperty({ example: 'banknote' })
  @IsString()
  icon!: string;

  @ApiProperty({ example: '#DBEAFE' })
  @IsString()
  bgColor!: string;

  @ApiProperty({ example: '#3B82F6' })
  @IsString()
  iconColor!: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  costBasisRub?: number;

  @ApiPropertyOptional({
    example: null,
    description: 'id связанного расхода (ежемесячный платёж по кредиту)',
  })
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

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
