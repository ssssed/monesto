import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class GetRulesBudgetQueryDto {
  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional()
  @IsDateString()
  today?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Исключить правило (при редактировании)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  excludeRuleId?: number;
}
