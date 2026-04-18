import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ enum: ['buy', 'sell'] })
  @IsIn(['buy', 'sell'])
  type!: 'buy' | 'sell';

  @ApiProperty({
    description: 'Цена (строка, как на фронте)',
    example: '6200.5',
  })
  @IsString()
  price!: string;

  @ApiProperty({
    description:
      'Количество (строка). Для base-актива сервер сохранит count=1 независимо от значения.',
    example: '10',
  })
  @IsString()
  count!: string;
}
