import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateMonthDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'incoming must be a valid number string with up to 2 decimals',
  })
  incoming?: string; // теперь строка, можно с точкой

  @IsOptional()
  @IsString()
  incomingCurrency?: string; // валюта для дохода

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'mandatory must be a valid number string with up to 2 decimals',
  })
  mandatory?: string; // теперь строка, можно с точкой

  @IsOptional()
  @IsString()
  mandatoryCurrency?: string; // валюта для обязательных расходов

  @IsOptional()
  @IsString()
  strategy?: string; // стратегия накопления
}
