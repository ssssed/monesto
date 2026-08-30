import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';

/** Один транш зарплаты: день выплаты + период работы, который эта выплата закрывает. */
export class SalaryTrancheDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  paymentDay!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  periodFromDay!: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  periodToDay!: number;

  @ApiProperty({
    example: 0,
    enum: [0, -1],
    description: '0 = месяц выплаты, -1 = предыдущий месяц',
  })
  @IsIn([0, -1])
  periodMonthOffset!: 0 | -1;
}
