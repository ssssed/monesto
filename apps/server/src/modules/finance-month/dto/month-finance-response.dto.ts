import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { MandatoryBreakdownLineKind } from './patch-month-finance.dto';

export class MonthFinanceBreakdownLineResponseDto {
  @ApiProperty({ example: '12' })
  id!: string;

  @ApiProperty({
    enum: MandatoryBreakdownLineKind,
    enumName: 'MandatoryBreakdownLineKind',
    example: MandatoryBreakdownLineKind.custom,
  })
  kind!: MandatoryBreakdownLineKind;

  @ApiProperty({ example: 'Rent' })
  label!: string;

  @ApiProperty({ example: '25000' })
  amount!: string;
}

export class MonthFinanceStepStateDto {
  @ApiProperty({ example: true })
  filled!: boolean;

  @ApiProperty({ example: '150000' })
  value!: string;

  @ApiProperty({
    type: MonthFinanceBreakdownLineResponseDto,
    isArray: true,
    required: false,
    description: 'Только для mandatory; для incoming всегда пустой массив',
  })
  breakdown?: MonthFinanceBreakdownLineResponseDto[];
}

export class MonthFinanceResponseDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 6 })
  month!: number;

  @ApiProperty({ enum: Currency, enumName: 'Currency', example: Currency.rub })
  currency!: Currency;

  @ApiProperty({
    enum: ['empty', 'partial', 'complete'],
    example: 'partial',
    description:
      'empty — ничего не заполнено; partial — заполнен один шаг; complete — оба шага',
  })
  status!: 'empty' | 'partial' | 'complete';

  @ApiProperty({ type: MonthFinanceStepStateDto })
  incoming!: MonthFinanceStepStateDto;

  @ApiProperty({ type: MonthFinanceStepStateDto })
  mandatory!: MonthFinanceStepStateDto;
}
