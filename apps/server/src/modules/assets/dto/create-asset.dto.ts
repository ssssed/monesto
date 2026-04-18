import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IconDto } from './icon.dto';

export class CreateAssetDto {
  @ApiProperty({ enum: ['base', 'priced'] })
  @IsIn(['base', 'priced'])
  type!: 'base' | 'priced';

  @ApiProperty({ example: 'Золото' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Обязательно для type=priced (единица количества)',
    required: false,
    example: 'г',
  })
  @ValidateIf((o: CreateAssetDto) => o.type === 'priced')
  @IsString()
  unit?: string;

  @ApiProperty({ type: IconDto })
  @IsObject()
  @ValidateNested()
  @Type(() => IconDto)
  icon!: IconDto;
}
