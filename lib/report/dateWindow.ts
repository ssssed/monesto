import { startOfDay } from '@/lib/calendar/workingDays';
import {
  calculateSalaryPaymentAmount,
  getNextPrimaryPaymentDate,
  getSalaryWorkPeriod,
  getUpcomingBimonthlyPayments,
} from '@/lib/report/calculateSalaryPayment';
import type {
  Expense,
  IncomeSource,
  ReportExpenseLine,
  ReportIncomeLine,
  SalaryPaymentDay,
} from '@/lib/types';

export function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

export function formatReportDate(date: Date): string {
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Окно отчёта для primary=25:
 *   incomeDate = ближайшая/текущая выплата 25-го
 *   expenseEndExclusive = следующее 10-е (не включительно)
 *   → расходы 30-го вычитаются из дохода 25-го
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
      // Ещё в цикле прошлого 25-го (расходы до 10-го exclusive)
      incomeDate = startOfDay(new Date(year, month - 1, 25));
    } else if (day > 25) {
      // После 25-го, до следующего 10-го — тот же цикл
      incomeDate = startOfDay(new Date(year, month, 25));
    } else {
      incomeDate = getNextPrimaryPaymentDate(todayStart, 25);
    }
  } else {
    // primary = 10; цикл расходов до 25-го exclusive
    if (day > 10 && day < 25) {
      incomeDate = startOfDay(new Date(year, month, 10));
    } else if (day >= 25) {
      // После 25-го — следующий цикл к 10-му следующего месяца
      incomeDate = getNextPrimaryPaymentDate(todayStart, 10);
    } else {
      // day <= 10
      incomeDate = getNextPrimaryPaymentDate(todayStart, 10);
    }
  }

  const expenseEndExclusive =
    primaryPaymentDay === 25
      ? startOfDay(new Date(incomeDate.getFullYear(), incomeDate.getMonth() + 1, 10))
      : startOfDay(new Date(incomeDate.getFullYear(), incomeDate.getMonth(), 25));

  // Если incomeDate уже прошёл — всё равно показываем его в отчёте цикла
  const incomeStart = todayStart <= incomeDate ? todayStart : incomeDate;

  return { incomeDate, expenseEndExclusive, incomeStart };
}

/** @deprecated используйте resolveReportWindow — оставлено для совместимости тестов display date */
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
    if (income.income_kind === 'bimonthly_salary') {
      const monthlyAmount = income.monthly_amount ?? 0;
      // Берём выплаты от начала цикла до target (включая уже прошедшую primary)
      const payments = getUpcomingBimonthlyPayments(windowStart, target);

      for (const payment of payments) {
        // Не показываем будущие выплаты после today, если они за пределами... 
        // Показываем все в [windowStart, target]
        const calc = calculateSalaryPaymentAmount(
          monthlyAmount,
          payment.paymentDay,
          payment.date,
        );
        lines.push({
          name: income.name,
          amount: calc.amount,
          detail: `${calc.periodLabel}, ${calc.workingDays} р.д.`,
          paymentDate: payment.date,
        });
      }
      continue;
    }

    if (income.is_one_time || income.recurrence === 'one_time') {
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

    const cursor = startOfDay(new Date(windowStart.getFullYear(), windowStart.getMonth(), 1));
    while (cursor <= target) {
      const paymentDate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), income.payment_day),
      );
      if (paymentDate >= windowStart && paymentDate <= target) {
        // Для forward-looking: если выплата уже прошла и это не цикл-income — всё равно включаем в окне
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

  void todayStart; // reserved for future filtering of "already received" badges
  return lines.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
}

/**
 * Расходы в [today, expenseEndExclusive) — конец не включительно.
 * Расход 30-го входит в цикл после 25-го и до следующего 10-го.
 */
export function expandExpensesToLines(
  expenses: Expense[],
  today: Date,
  expenseEndExclusive: Date,
): ReportExpenseLine[] {
  const lines: ReportExpenseLine[] = [];
  const todayStart = startOfDay(today);
  const endExclusive = startOfDay(expenseEndExclusive);

  for (const expense of expenses) {
    if (expense.recurrence === 'one_time') {
      if (!expense.specific_date) continue;
      const date = parseDate(expense.specific_date);
      if (date >= todayStart && date < endExclusive) {
        lines.push({ name: expense.name, amount: expense.amount, detail: expense.specific_date });
      }
      continue;
    }

    if (expense.due_day == null) continue;

    // Итерируем месяцы от текущего до месяца endExclusive
    const cursor = startOfDay(new Date(todayStart.getFullYear(), todayStart.getMonth(), 1));
    const lastMonth = startOfDay(
      new Date(endExclusive.getFullYear(), endExclusive.getMonth(), 1),
    );

    while (cursor <= lastMonth) {
      const dueDate = startOfDay(
        new Date(cursor.getFullYear(), cursor.getMonth(), expense.due_day),
      );
      if (dueDate >= todayStart && dueDate < endExclusive) {
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

export function findPrimaryIncome(incomes: IncomeSource[]): IncomeSource | undefined {
  return incomes.find((income) => income.is_primary);
}

export { getSalaryWorkPeriod };
