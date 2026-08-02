export type IncomeKind = 'fixed' | 'bimonthly_salary';
export type Recurrence = 'monthly' | 'one_time';
/** День выплаты (1–31). Раньше было жёстко 10 | 25. */
export type SalaryPaymentDay = number;
export type AssetProvider = 'rub' | 'usd' | 'gold' | 'steam';
export type RuleType = 'percent' | 'fixed';
export type RuleCurrency = 'rub' | 'asset';

/**
 * Один транш зарплаты: день выплаты + период работы, который эта выплата закрывает.
 * periodMonthOffset: 0 = месяц выплаты, -1 = предыдущий месяц.
 */
export interface SalaryTranche {
  paymentDay: number;
  periodFromDay: number;
  periodToDay: number;
  periodMonthOffset: 0 | -1;
}

export interface IncomeSource {
  id: number;
  name: string;
  income_kind: IncomeKind;
  amount: number | null;
  monthly_amount: number | null;
  is_one_time: boolean;
  recurrence: Recurrence;
  payment_day: number | null;
  is_primary: boolean;
  primary_payment_day: SalaryPaymentDay | null;
  specific_date: string | null;
  /** Транши для income_kind = bimonthly_salary. null → дефолт 10/25. */
  salary_tranches: SalaryTranche[] | null;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  recurrence: Recurrence;
  due_day: number | null;
  specific_date: string | null;
}

export interface Asset {
  id: number;
  name: string;
  provider: AssetProvider;
  purpose: string | null;
  goal_amount: number | null;
  current_amount: number;
  steam_inventory_url: string | null;
  icon: string;
  bg_color: string;
  icon_color: string;
  cost_basis_rub: number;
}

export interface AssetTransaction {
  id: number;
  asset_id: number;
  amount_delta: number;
  note: string | null;
  created_at: string;
  cost_rub: number | null;
}

export interface DistributionRule {
  id: number;
  name: string;
  rule_type: RuleType;
  value: number;
  currency: RuleCurrency;
  target_asset_id: number | null;
  sort_order: number;
}

export interface MoneyFlowEntry {
  id?: string;
  name: string;
  amount: string;
  isOneTime?: boolean;
  isBimonthlySalary?: boolean;
  monthlyAmount?: string;
  paymentDay?: string;
  dueDay?: string;
  specificDate?: string;
  isPrimary?: boolean;
  primaryPaymentDay?: SalaryPaymentDay;
  /** 1 или 2 транша для зарплаты по периодам. */
  salaryTranches?: SalaryTranche[];
}

export interface ReportIncomeLine {
  name: string;
  amount: number;
  detail?: string;
  paymentDate: Date;
}

export interface ReportExpenseLine {
  name: string;
  amount: number;
  detail?: string;
}

export interface RuleAllocation {
  name: string;
  amountRub: number;
  detail?: string;
  ruleId: number;
  targetAssetId: number | null;
}

export interface ReportResult {
  /** Фактическая дата выплаты (с учётом выходных). */
  targetDate: Date;
  /** Календарный якорь выплаты. */
  nominalDate: Date;
  payoutDate: Date;
  paymentDay: SalaryPaymentDay;
  /** true — будущий цикл, подтверждения ещё недоступны. */
  isPreview: boolean;
  cycleKey: string;
  incomeLines: ReportIncomeLine[];
  totalIncome: number;
  expenseLines: ReportExpenseLine[];
  totalExpenses: number;
  remainder: number;
  allocations: RuleAllocation[];
  totalAllocations: number;
  freeMoney: number;
  assetSummary?: {
    id: number;
    name: string;
    nativeAmount: number;
    rubEquivalent: number;
    provider: AssetProvider;
    icon: string;
    bg_color: string;
    icon_color: string;
    incomingRub: number;
  }[];
}

export type ReportErrorCode = 'NO_PRIMARY_SALARY' | 'MISSING_USD_RATE';

export interface ReportError {
  code: ReportErrorCode;
  message: string;
}

export interface UsdValuation {
  averageBuyRate: number | null;
  currentValueRub: number;
  costBasisRub: number;
  profitRub: number;
  profitPercent: number | null;
}
