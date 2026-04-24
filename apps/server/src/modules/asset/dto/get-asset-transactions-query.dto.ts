import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const ASSET_PERIODS = ['1M', '3M', '6M', '1Y', 'ALL'] as const;
export type AssetPeriod = (typeof ASSET_PERIODS)[number];

export class GetAssetTransactionsQueryDto {
  @ApiPropertyOptional({ enum: ASSET_PERIODS, default: '6M' })
  @IsOptional()
  @IsIn(ASSET_PERIODS)
  period?: AssetPeriod;
}
