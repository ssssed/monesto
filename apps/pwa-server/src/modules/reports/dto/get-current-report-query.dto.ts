import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class GetCurrentReportQueryDto {
  @ApiPropertyOptional({
    example: '2026-07-15',
    description:
      'Дата "сегодня" клиента (его локальная дата). По умолчанию — время сервера.',
  })
  @IsOptional()
  @IsDateString()
  today?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Якорь цикла (день выплаты)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cyclePaymentDay?: number;

  @ApiPropertyOptional({
    example: '2026-07-25',
    description: 'Явная номинальная дата цикла (переключение цикла в UI)',
  })
  @IsOptional()
  @IsDateString()
  cycleNominalDate?: string;
}
