import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TelegramAuthDto {
  @ApiProperty({
    example: 'query_id=...&user=...&auth_date=...&hash=...',
    description: 'Telegram WebApp initData string',
  })
  @IsString()
  initData: string;
}
