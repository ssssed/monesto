import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class AssetIconDto {
  @ApiProperty({ example: 'banknote' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '#DBEAFE' })
  @IsString()
  backgroundColor!: string;

  @ApiProperty({ example: '#3B82F6' })
  @IsString()
  color!: string;
}

export class CreateAssetDto {
  @ApiProperty({ example: 'Сбережения' })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiProperty({
    enum: Currency,
    enumName: 'Currency',
    required: false,
    description: 'Если не передано, берется базовая валюта пользователя',
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ type: AssetIconDto })
  @ValidateNested()
  @Type(() => AssetIconDto)
  icon!: AssetIconDto;
}
