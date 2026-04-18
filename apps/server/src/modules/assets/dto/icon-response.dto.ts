import { ApiProperty } from '@nestjs/swagger';

export class IconResponseDto {
  @ApiProperty({ example: 'banknote' })
  name!: string;

  @ApiProperty({ example: '#DBEAFE' })
  backgroundColor!: string;

  @ApiProperty({ example: '#3B82F6' })
  color!: string;
}
