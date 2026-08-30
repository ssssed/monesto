import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoneyFlowCurrency, IncomeKind, Recurrence } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SalaryTrancheDto } from './salary-tranche.dto';

export class CreateIncomeSourceDto {
  @ApiProperty({ example: 'Зарплата' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: MoneyFlowCurrency, enumName: 'MoneyFlowCurrency' })
  @IsEnum(MoneyFlowCurrency)
  currency!: MoneyFlowCurrency;

  @ApiProperty({ enum: IncomeKind, enumName: 'IncomeKind' })
  @IsEnum(IncomeKind)
  incomeKind!: IncomeKind;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  monthlyAmount?: number;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  isOneTime!: boolean;

  @ApiProperty({ enum: Recurrence, enumName: 'Recurrence' })
  @IsEnum(Recurrence)
  recurrence!: Recurrence;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  paymentDay?: number;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  isPrimary!: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  primaryPaymentDay?: number;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @ApiPropertyOptional({ type: [SalaryTrancheDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => SalaryTrancheDto)
  salaryTranches?: SalaryTrancheDto[];
}
