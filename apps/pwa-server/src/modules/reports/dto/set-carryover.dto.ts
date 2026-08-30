import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class SetCarryoverDto {
  @ApiProperty({
    example: '2026-07-25',
    description: 'cycleKey из ответа GET /reports/current',
  })
  @IsString()
  cycleKey!: string;

  @ApiProperty({ example: 15000, description: 'Сумма переноса, ₽' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountRub!: number;
}
