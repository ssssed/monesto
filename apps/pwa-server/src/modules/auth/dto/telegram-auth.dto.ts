import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

/** Payload от Telegram Login Widget (https://core.telegram.org/widgets/login). */
export class TelegramAuthDto {
  @ApiProperty({ example: 123456789 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  first_name!: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: 'ada_lovelace' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'https://t.me/i/userpic/320/ada.jpg' })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({ example: 1735689600, description: 'Unix timestamp (сек.)' })
  @IsInt()
  auth_date!: number;

  @ApiProperty({ example: 'a1b2c3...' })
  @IsString()
  hash!: string;
}
