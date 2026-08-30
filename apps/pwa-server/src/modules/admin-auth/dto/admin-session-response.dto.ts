import { ApiProperty } from '@nestjs/swagger';

export class AdminResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'admin@monesto.app' })
  email!: string;
}

export class AdminSessionResponseDto {
  @ApiProperty({ type: AdminResponseDto })
  admin!: AdminResponseDto;

  @ApiProperty({ example: 'e4b1c9a0-1234-4a5b-8c9d-abcdef123456' })
  sessionToken!: string;
}
