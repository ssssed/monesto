import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateIncomeSourceDto {
  @ApiPropertyOptional({ example: 'Зарплата' })
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

  @ApiPropertyOptional({ enum: IncomeKind, enumName: 'IncomeKind' })
  @IsOptional()
  @IsEnum(IncomeKind)
  incomeKind?: IncomeKind;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  monthlyAmount?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiPropertyOptional({ enum: Recurrence, enumName: 'Recurrence' })
  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  paymentDay?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

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
