import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { AllocationRuleAssetIconDto } from './allocation-rule-asset-icon.dto';

export class AllocationRuleAssetDto {
  @ApiProperty({ example: 'Золото' })
  name!: string;

  @ApiProperty({
    enum: Currency,
    enumName: 'Currency',
    example: Currency.gold,
  })
  currency!: Currency;

  @ApiProperty({
    example: 'г',
    description: 'Символ валюты актива',
  })
  symbol!: string;

  @ApiProperty({ type: AllocationRuleAssetIconDto })
  icon!: AllocationRuleAssetIconDto;
}
