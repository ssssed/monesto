import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'user@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ example: null, nullable: true })
  telegramId!: string | null;

  @ApiProperty({ example: null, nullable: true })
  telegramUsername!: string | null;

  @ApiProperty({ example: null, nullable: true })
  firstName!: string | null;

  @ApiProperty({ example: null, nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: 'usd' })
  baseCurrency!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class SessionResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({
    example: 'e4b1c9a0-1234-4a5b-8c9d-abcdef123456',
    description:
      'Bearer session token — use as `Authorization: Bearer <sessionToken>`',
  })
  sessionToken!: string;
}
