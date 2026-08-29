import { ApiPropertyOptional } from '@nestjs/swagger';
import { MoneyFlowCurrency } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserSettingsDto {
  @ApiPropertyOptional({
    enum: MoneyFlowCurrency,
    enumName: 'MoneyFlowCurrency',
  })
  @IsOptional()
  @IsEnum(MoneyFlowCurrency)
  baseCurrency?: MoneyFlowCurrency;
}
