import { ApiProperty } from '@nestjs/swagger';
import { IconResponseDto } from './icon-response.dto';

export class AssetBaseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ example: '₽' })
  symbol!: string;

  @ApiProperty({ description: 'Оценка / баланс' })
  price!: number;

  @ApiProperty({ type: IconResponseDto })
  icon!: IconResponseDto;

  @ApiProperty({ enum: ['base'] })
  type!: 'base';
}

export class AssetPricedResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ example: '₽' })
  symbol!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty({ type: IconResponseDto })
  icon!: IconResponseDto;

  @ApiProperty({ enum: ['priced'] })
  type!: 'priced';

  @ApiProperty({
    description: 'Процент изменения цены по двум последним транзакциям',
  })
  priceChange!: number;

  @ApiProperty({ description: 'Количество (для priced)' })
  count!: number;
}
