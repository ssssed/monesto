export type IncomeKind = 'fixed' | 'bimonthly_salary';
export type Recurrence = 'monthly' | 'one_time';
export type MoneyFlowCurrency = 'rub' | 'usd';
/** День выплаты (1–31). Раньше было жёстко 10 | 25. */
export type SalaryPaymentDay = number;
export type AssetProvider = 'rub' | 'usd' | 'gold' | 'steam' | 'credit';
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
  currency: MoneyFlowCurrency;
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
  currency: MoneyFlowCurrency;
  amount: number;
  recurrence: Recurrence;
  due_day: number | null;
  specific_date: string | null;
  /** Платёж по кредиту (asset provider=credit). */
  linked_asset_id: number | null;
}

export interface Asset {
  id: number;
  name: string;
  provider: AssetProvider;
  purpose: string | null;
  /** Для накоплений — цель; для кредита — исходный долг. */
  goal_amount: number | null;
  /** Для накоплений — баланс; для кредита — остаток долга. */
  current_amount: number;
  steam_inventory_url: string | null;
  icon: string;
  bg_color: string;
  icon_color: string;
  cost_basis_rub: number;
  /** Ежемесячный расход-платёж по кредиту. */
  linked_expense_id: number | null;
  /**
   * Годовая ставка %, например 19.9. null → простой долг без процентов
   * (остаток / платёж).
   */
  credit_annual_rate: number | null;
  /** Исходный срок кредита в месяцах (при наличии ставки). */
  credit_term_months: number | null;
  /** Дата выдачи кредита, ISO YYYY-MM-DD. */
  credit_start_date: string | null;
  /**
   * Сколько месяцев осталось по графику. Если задано — используется
   * при пересчёте платежа; иначе считается из даты выдачи или NPER.
   */
  credit_remaining_months: number | null;
  /**
   * Как применять досрочные погашения при ставке:
   * reduce_term — платёж тот же, срок короче;
   * reduce_payment — срок тот же, платёж меньше.
   * При взносе можно переопределить в модалке / правиле.
   */
  credit_early_repay_mode: 'reduce_term' | 'reduce_payment' | null;
  /** Порядок в списке активов. */
  sort_order: number;
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
  /** Режим досрочки, если цель — кредит со ставкой. */
  credit_early_repay_mode: 'reduce_term' | 'reduce_payment' | null;
}

/** Период отпуска: даты включительно, ISO YYYY-MM-DD. */
export interface VacationPeriod {
  id: number;
  start_date: string;
  end_date: string;
}

export interface MoneyFlowEntry {
  id?: string;
  name: string;
  currency?: MoneyFlowCurrency;
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
  /** Expense: id кредита (asset), если это платёж по кредиту. */
  linkedAssetId?: string;
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
