import { ApiProperty } from '@nestjs/swagger';

export class FxRateResponseDto {
  @ApiProperty({ example: 'USD' })
  base!: string;

  @ApiProperty({ example: 'RUB' })
  quote!: string;

  @ApiProperty({ example: 82.5 })
  rate!: string;

  @ApiProperty({ example: 'open_er_api' })
  provider!: string;

  @ApiProperty()
  fetchedAt!: Date;
}
