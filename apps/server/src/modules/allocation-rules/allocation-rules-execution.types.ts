import type { TransactionType } from '@prisma/client';

export type AllocationRuleExecutionStatus =
  | 'executed'
  | 'skipped'
  | 'failed';

export interface AllocationRuleExecutionItem {
  ruleId: number;
  userId: number;
  status: AllocationRuleExecutionStatus;
  assetName?: string;
  transactionType?: TransactionType;
  quantity?: number;
  message?: string;
}

export interface AllocationRulesExecutionResult {
  dayOfMonth: number;
  totalRules: number;
  dueRules: number;
  executed: number;
  skipped: number;
  failed: number;
  items: AllocationRuleExecutionItem[];
}
