import { ApiProperty } from '@nestjs/swagger';

export class UserCreatedResponseDto {
  @ApiProperty({ description: 'Внутренний id пользователя (cuid)' })
  id!: string;

  @ApiProperty({ description: 'Стабильный id из Telegram' })
  telegramId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
