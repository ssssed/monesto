import { ApiProperty } from '@nestjs/swagger';

export class HistoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['buy', 'sell'] })
  type!: 'buy' | 'sell';

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'ISO-8601',
  })
  date!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty({ description: 'Снимок единицы (как symbol актива)' })
  unit!: string;

  @ApiProperty()
  count!: number;
}
