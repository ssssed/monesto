import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class AllocationRuleExecutionItemDto {
  @ApiProperty({ example: 1 })
  ruleId!: number;

  @ApiProperty({ example: 42 })
  userId!: number;

  @ApiProperty({ enum: ['executed', 'skipped', 'failed'] })
  status!: 'executed' | 'skipped' | 'failed';

  @ApiProperty({ required: false, example: 'Gold savings' })
  assetName?: string;

  @ApiProperty({ enum: TransactionType, required: false })
  transactionType?: TransactionType;

  @ApiProperty({ required: false, example: 1500 })
  quantity?: number;

  @ApiProperty({ required: false, example: 'Расчёт дал нулевой результат' })
  message?: string;
}

export class AllocationRulesExecutionResultDto {
  @ApiProperty({ example: 24 })
  dayOfMonth!: number;

  @ApiProperty({ example: 3 })
  totalRules!: number;

  @ApiProperty({ example: 1 })
  dueRules!: number;

  @ApiProperty({ example: 1 })
  executed!: number;

  @ApiProperty({ example: 0 })
  skipped!: number;

  @ApiProperty({ example: 0 })
  failed!: number;

  @ApiProperty({ type: AllocationRuleExecutionItemDto, isArray: true })
  items!: AllocationRuleExecutionItemDto[];
}
