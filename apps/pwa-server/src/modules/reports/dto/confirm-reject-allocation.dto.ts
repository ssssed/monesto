import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmRejectAllocationDto {
  @ApiProperty({
    example: '2026-07-25',
    description: 'cycleKey из ответа GET /reports/current',
  })
  @IsString()
  cycleKey!: string;
}
