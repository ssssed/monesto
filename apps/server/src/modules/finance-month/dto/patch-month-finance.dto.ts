import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum MonthFinanceStep {
  incoming = 'incoming',
  mandatory = 'mandatory',
}

export enum MandatoryBreakdownLineKind {
  unallocated = 'unallocated',
  custom = 'custom',
}

export class MandatoryBreakdownLineDto {
  @ApiPropertyOptional({
    example: '42',
    description: 'Идентификатор строки (при обновлении с клиента)',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    enum: MandatoryBreakdownLineKind,
    enumName: 'MandatoryBreakdownLineKind',
    example: MandatoryBreakdownLineKind.custom,
  })
  @IsOptional()
  @IsEnum(MandatoryBreakdownLineKind)
  kind?: MandatoryBreakdownLineKind;

  @ApiProperty({ example: 'Rent' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: '25000' })
  @IsString()
  amount!: string;
}

export class PatchMonthFinanceDto {
  @ApiProperty({
    enum: MonthFinanceStep,
    enumName: 'MonthFinanceStep',
    example: MonthFinanceStep.incoming,
    description: 'Шаг многошаговой формы: incoming — доход, mandatory — обязательные расходы',
  })
  @IsEnum(MonthFinanceStep)
  step!: MonthFinanceStep;

  @ApiPropertyOptional({
    example: '150000',
    description:
      'Сумма шага. Для incoming — обязательна. Для mandatory — итог (value), включая «не распределено»',
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    type: MandatoryBreakdownLineDto,
    isArray: true,
    description:
      'Детализация mandatory: custom-строки и опционально unallocated. Если есть breakdown — сохраняются все его строки',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MandatoryBreakdownLineDto)
  breakdown?: MandatoryBreakdownLineDto[];
}
