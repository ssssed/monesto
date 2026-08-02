import { startOfDay, toPayoutDate } from "../calendar/workingDays";
import {
  calculateSalaryPaymentAmount,
  getNextPrimaryPaymentDate,
  getSalaryWorkPeriod,
  getUpcomingBimonthlyPayments,
} from "./calculateSalaryPayment";
import type {
  Expense,
  IncomeSource,
  ReportExpenseLine,
  ReportIncomeLine,
  SalaryPaymentDay,
} from "../types";

export interface ReportCycle {
  paymentDay: SalaryPaymentDay;
  /** Календарный якорь 10/25. */
  nominalDate: Date;
  /** Фактическая выплата (сдвиг с выходного). */
  payoutDate: Date;
  expenseEndExclusive: Date;
  incomeStart: Date;
  /** Начало периода расходов = дата этой выплаты (зарплата покрывает траты до следующей). */
  expenseStart: Date;
  /** true, если выплата ещё не наступила. */
  isPreview: boolean;
}

export function formatReportDate(date: Date): string {
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

/**
 * Окно отчёта для primary=25:
 *   incomeDate = ближайшая/текущая выплата 25-го
 *   expenseEndExclusive = следующее 10-е (не включительно)
 *
 * Для primary=10 симметрично: расходы до следующего 25-го exclusive.
 */
export function resolveReportWindow(
  today: Date,
  primaryPaymentDay: SalaryPaymentDay,
): {
  incomeDate: Date;
  expenseEndExclusive: Date;
  incomeStart: Date;
} {
  const todayStart = startOfDay(today);
  const day = todayStart.getDate();
  const year = todayStart.getFullYear();
  const month = todayStart.getMonth();

  let incomeDate: Date;

  if (primaryPaymentDay === 25) {
    if (day < 10) {
      incomeDate = startOfDay(new Date(year, month - 1, 25));
    } else if (day > 25) {
      incomeDate = startOfDay(new Date(year, month, 25));
    } else {
      incomeDate = getNextPrimaryPaymentDate(todayStart, 25);
    }
  } else if (day > 10 && day < 25) {
    incomeDate = startOfDay(new Date(year, month, 10));
  } else if (day >= 25) {
    incomeDate = getNextPrimaryPaymentDate(todayStart, 10);
  } else {
    incomeDate = getNextPrimaryPaymentDate(todayStart, 10);
  }

  const expenseEndExclusive =
    primaryPaymentDay === 25
      ? startOfDay(
          new Date(incomeDate.getFullYear(), incomeDate.getMonth() + 1, 10),
        )
      : startOfDay(
          new Date(incomeDate.getFullYear(), incomeDate.getMonth(), 25),
        );

  const incomeStart = todayStart <= incomeDate ? todayStart : incomeDate;

  return { incomeDate, expenseEndExclusive, incomeStart };
}

/** Цикл отчёта для якоря 10 или 25 с учётом выходных. */
export function resolveReportCycle(
  today: Date,
  paymentDay: SalaryPaymentDay,
): ReportCycle {
  const todayStart = startOfDay(today);
  const {
    incomeDate,
    expenseEndExclusive: nextNominalPayment,
    incomeStart,
  } = resolveReportWindow(today, paymentDay);
  const payoutDate = toPayoutDate(incomeDate);
  const isPreview = todayStart < payoutDate;
  // Зарплата покрывает все траты от этой выплаты до следующей (exclusive).
  const expenseStart = payoutDate;
  const expenseEndExclusive = toPayoutDate(nextNominalPayment);

  return {
    paymentDay,
    nominalDate: incomeDate,
    payoutDate,
    expenseEndExclusive,
    incomeStart,
    expenseStart,
    isPreview,
  };
}

/** Оба доступных цикла, отсортированные по дате выплаты (раньше → левее). */
export function listReportCycles(today: Date): ReportCycle[] {
  return [resolveReportCycle(today, 10), resolveReportCycle(today, 25)].sort(
    (a, b) => a.payoutDate.getTime() - b.payoutDate.getTime(),
  );
}

/** @deprecated используйте resolveReportWindow */
export function resolveTargetDate(
  today: Date,
  primaryPaymentDay: SalaryPaymentDay,
): Date {
  return resolveReportWindow(today, primaryPaymentDay).incomeDate;
}

export function expandIncomeToLines(
  incomes: IncomeSource[],
  today: Date,
  targetDate: Date,
  incomeStart?: Date,
): ReportIncomeLine[] {
  const lines: ReportIncomeLine[] = [];
  const windowStart = startOfDay(incomeStart ?? today);
  const target = startOfDay(targetDate);
  const todayStart = startOfDay(today);

  for (const income of incomes) {
    if (income.income_kind === "bimonthly_salary") {
      const monthlyAmount = income.monthly_amount ?? 0;
      const payments = getUpcomingBimonthlyPayments(windowStart, target);

      for (const payment of payments) {
        const calc = calculateSalaryPaymentAmount(
          monthlyAmount,
          payment.paymentDay,
          payment.date,
        );
        lines.push({
          name: income.name,
          amount: calc.amount,
          detail: `${calc.periodLabel}, ${calc.workingDays} р.д.`,
          paymentDate: toPayoutDate(payment.date),
        });
      }
      continue;
    }

    if (income.is_one_time || income.recurrence === "one_time") {
      if (!income.specific_date) continue;
      const date = parseDate(income.specific_date);
      if (date >= windowStart && date <= target) {
        lines.push({
          name: income.name,
          amount: income.amount ?? 0,
          paymentDate: date,
        });
      }
      continue;
    }

    if (income.payment_day == null) continue;

    const cursor = startOfDay(
      new Date(windowStart.getFullYear(), windowStart.getMonth(), 1),
    );
    while (cursor <= target) {
      const paymentDate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), income.payment_day),
      );
      if (paymentDate >= windowStart && paymentDate <= target) {
        lines.push({
          name: income.name,
          amount: income.amount ?? 0,
          detail: `${income.payment_day}-е число`,
          paymentDate,
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  void todayStart;
  return lines.sort(
    (a, b) => a.paymentDate.getTime() - b.paymentDate.getTime(),
  );
}

/**
 * Расходы в [expenseStart, expenseEndExclusive).
 */
export function expandExpensesToLines(
  expenses: Expense[],
  expenseStart: Date,
  expenseEndExclusive: Date,
): ReportExpenseLine[] {
  const lines: ReportExpenseLine[] = [];
  const rangeStart = startOfDay(expenseStart);
  const endExclusive = startOfDay(expenseEndExclusive);

  for (const expense of expenses) {
    if (expense.recurrence === "one_time") {
      if (!expense.specific_date) continue;
      const date = parseDate(expense.specific_date);
      if (date >= rangeStart && date < endExclusive) {
        lines.push({
          name: expense.name,
          amount: expense.amount,
          detail: expense.specific_date,
        });
      }
      continue;
    }

    if (expense.due_day == null) continue;

    const cursor = startOfDay(
      new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1),
    );
    const lastMonth = startOfDay(
      new Date(endExclusive.getFullYear(), endExclusive.getMonth(), 1),
    );

    while (cursor <= lastMonth) {
      const dueDate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), expense.due_day),
      );
      if (dueDate >= rangeStart && dueDate < endExclusive) {
        lines.push({
          name: expense.name,
          amount: expense.amount,
          detail: `${expense.due_day}-е число`,
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return lines;
}

export function findPrimaryIncome(
  incomes: IncomeSource[],
): IncomeSource | undefined {
  return incomes.find((income) => income.is_primary);
}

export { getSalaryWorkPeriod };
