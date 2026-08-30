import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditEarlyRepayMode } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAssetTransactionDto {
  @ApiProperty({
    example: 10000,
    description: 'Положительное — пополнение, отрицательное — списание',
  })
  @IsNumber()
  amountDelta!: number;

  @ApiPropertyOptional({ example: 'Пополнение с зарплаты' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Себестоимость в рублях на момент операции',
  })
  @IsOptional()
  @IsNumber()
  costRub?: number;

  @ApiPropertyOptional({
    enum: CreditEarlyRepayMode,
    enumName: 'CreditEarlyRepayMode',
    description:
      'Только для активов-кредитов: как применить досрочное погашение. По умолчанию — asset.creditEarlyRepayMode, затем reduce_term.',
  })
  @IsOptional()
  @IsEnum(CreditEarlyRepayMode)
  earlyRepayMode?: CreditEarlyRepayMode;
}
