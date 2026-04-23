import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBaseCurrencyDto {
  @ApiProperty({ enum: Currency, enumName: 'Currency' })
  @IsEnum(Currency)
  baseCurrency!: Currency;
}
