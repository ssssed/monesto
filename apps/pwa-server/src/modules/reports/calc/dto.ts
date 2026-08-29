import {
  AssetProvider,
  MoneyFlowCurrency,
  RuleCurrency,
  RuleType,
} from '@prisma/client';

export type AllocationStatus = 'pending' | 'confirmed' | 'rejected';

export interface RuleAllocationDto {
  ruleId: number;
  name: string;
  ruleType: RuleType;
  value: number;
  currency: RuleCurrency;
  targetAssetId: number | null;
  targetAssetName: string | null;
  amountRub: number;
  status: AllocationStatus;
}

export type ReportIncomeLineKind =
  | 'bimonthly_salary'
  | 'vacation_payout'
  | 'one_time'
  | 'fixed_day';

export interface ReportIncomeLineDto {
  incomeSourceId: number;
  name: string;
  currency: MoneyFlowCurrency;
  nativeAmount: number;
  amountRub: number;
  paymentDate: string;
  kind: ReportIncomeLineKind;
  periodFrom?: string;
  periodTo?: string;
  workingDays?: number;
  totalMonthWorkingDays?: number;
  vacationId?: number;
  vacationStart?: string;
  vacationEnd?: string;
  vacationDays?: number;
  paymentDay?: number;
}

export interface ReportExpenseLineDto {
  expenseId: number;
  name: string;
  currency: MoneyFlowCurrency;
  nativeAmount: number;
  amountRub: number;
  kind: 'one_time' | 'recurring';
  dueDate?: string;
}

export interface AssetSummaryDto {
  id: number;
  name: string;
  provider: AssetProvider;
  icon: string;
  bgColor: string;
  iconColor: string;
  nativeAmount: number;
  rubEquivalent: number;
  incomingRub: number;
}

export interface ReportResultDto {
  cyclePaymentDay: number;
  nominalDate: string;
  payoutDate: string;
  isPreview: boolean;
  cycleKey: string;
  incomeLines: ReportIncomeLineDto[];
  totalIncome: number;
  expenseLines: ReportExpenseLineDto[];
  totalExpenses: number;
  remainder: number;
  allocations: RuleAllocationDto[];
  totalAllocations: number;
  freeMoney: number;
  assetSummary: AssetSummaryDto[];
  usdRubRate: number;
}

export interface ReportCycleDto {
  paymentDay: number;
  nominalDate: string;
  payoutDate: string;
  isPreview: boolean;
}
