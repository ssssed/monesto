import { ApiProperty } from '@nestjs/swagger';
import { LanguageCode } from '@prisma/client';

export class MeUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '648368196' })
  telegramId!: string;

  @ApiProperty({ example: 'Иван' })
  firstName!: string;

  @ApiProperty({ example: 'Иванов' })
  lastName!: string;

  @ApiProperty({ example: 'ivanov' })
  username!: string;

  @ApiProperty({ enum: LanguageCode, enumName: 'LanguageCode' })
  languageCode!: LanguageCode;

  @ApiProperty({ type: String, format: 'date-time' })
  registerAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updateAt!: Date;
}

export class MeResponseDto {
  @ApiProperty({ type: MeUserDto })
  user!: MeUserDto;
}
