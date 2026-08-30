import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeatureFlagResponseDto {
  @ApiProperty({ example: 'year_summary' })
  key!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiPropertyOptional({ example: 'Показывать годовой отчёт в настройках' })
  description!: string | null;

  @ApiProperty()
  updatedAt!: Date;
}
