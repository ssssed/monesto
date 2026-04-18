import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Стабильный user.id из Telegram (строка)',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  telegramId!: string;
}
