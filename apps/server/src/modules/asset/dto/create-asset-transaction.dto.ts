import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumberString } from 'class-validator';

export class CreateAssetTransactionDto {
  @ApiProperty({ enum: ['buy', 'sell'], example: 'buy' })
  @IsIn(['buy', 'sell'])
  type!: 'buy' | 'sell';

  @ApiProperty({ example: '10' })
  @IsNumberString()
  count!: string;

  @ApiProperty({ example: '120.5' })
  @IsNumberString()
  price!: string;
}
