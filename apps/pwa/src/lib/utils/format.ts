import type { Expense, IncomeSource, MoneyFlowEntry } from '../types';
import { createEmptyBimonthlyTranches } from '../report/calculateSalaryPayment';

export function formatRub(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function formatMoney(amount: number, provider: 'rub' | 'usd'): string {
  return provider === 'usd' ? formatUsd(amount) : formatRub(amount);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyIncomeEntry(): MoneyFlowEntry {
  return {
    id: `${Date.now()}-${Math.random()}`,
    name: '',
    amount: '',
    isOneTime: false,
    isBimonthlySalary: false,
    monthlyAmount: '',
    paymentDay: '',
    isPrimary: false,
    primaryPaymentDay: 25,
    salaryTranches: createEmptyBimonthlyTranches(),
  };
}

export function createEmptyExpenseEntry(): MoneyFlowEntry {
  return {
    id: `${Date.now()}-${Math.random()}`,
    name: '',
    amount: '',
    isOneTime: false,
    dueDay: '',
  };
}

export function incomesToEntries(incomes: IncomeSource[]): MoneyFlowEntry[] {
  return incomes.map((income) => ({
    id: String(income.id),
    name: income.name,
    amount: income.amount != null ? String(income.amount) : '',
    isOneTime: income.is_one_time,
    isBimonthlySalary: income.income_kind === 'bimonthly_salary',
    monthlyAmount:
      income.monthly_amount != null ? String(income.monthly_amount) : '',
    paymentDay: income.payment_day != null ? String(income.payment_day) : '',
    specificDate: income.specific_date ?? undefined,
    isPrimary: income.is_primary,
    primaryPaymentDay: income.primary_payment_day ?? 25,
    salaryTranches:
      income.salary_tranches ??
      (income.income_kind === 'bimonthly_salary'
        ? createEmptyBimonthlyTranches()
        : undefined),
  }));
}

export function expensesToEntries(expenses: Expense[]): MoneyFlowEntry[] {
  return expenses.map((expense) => ({
    id: String(expense.id),
    name: expense.name,
    amount: String(expense.amount),
    isOneTime: expense.recurrence === 'one_time',
    dueDay: expense.due_day != null ? String(expense.due_day) : '',
    specificDate: expense.specific_date ?? undefined,
  }));
}
