import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@monesto.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'change-me' })
  @MinLength(8)
  password!: string;
}
