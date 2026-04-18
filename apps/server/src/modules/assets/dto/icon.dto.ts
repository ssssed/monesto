import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { ACCESSIBLE_ICON_NAMES } from '../constants/accessible-icons';

export class IconDto {
  @ApiProperty({
    enum: ACCESSIBLE_ICON_NAMES,
    example: 'banknote',
  })
  @IsString()
  @IsIn([...ACCESSIBLE_ICON_NAMES])
  name!: string;

  @ApiProperty({ example: '#DBEAFE' })
  @IsString()
  backgroundColor!: string;

  @ApiProperty({ example: '#3B82F6' })
  @IsString()
  color!: string;
}
