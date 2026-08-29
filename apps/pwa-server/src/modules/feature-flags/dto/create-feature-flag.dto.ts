import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateFeatureFlagDto {
  @ApiProperty({
    example: 'year_summary',
    description: 'Уникальный ключ флага',
  })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'key must contain only lowercase letters, digits and underscores',
  })
  key!: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'Показывать годовой отчёт в настройках' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
