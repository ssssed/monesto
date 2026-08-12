import type { Asset, Expense } from '../types';

export type CreditEarlyRepayMode = 'reduce_term' | 'reduce_payment';

/** Округление до копеек (банковский аннуитет). */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Доля погашения 0…1. */
export function creditRepaidRatio(asset: Asset): number | null {
  const initial = asset.goal_amount;
  if (initial == null || initial <= 0) return null;
  const repaid = Math.max(0, initial - asset.current_amount);
  return Math.min(1, repaid / initial);
}

export function creditRepaidAmount(asset: Asset): number {
  const initial = asset.goal_amount ?? asset.current_amount;
  return Math.max(0, initial - asset.current_amount);
}

export function hasCreditInterest(asset: Asset): boolean {
  return (
    asset.provider === 'credit' &&
    asset.credit_annual_rate != null &&
    asset.credit_annual_rate > 0
  );
}

/** Месячная ставка из годовой %. */
export function monthlyRateFromAnnual(annualPercent: number): number {
  return annualPercent / 100 / 12;
}

/**
 * Аннуитетный платёж по исходной сумме и полному сроку (как при выдаче).
 * P = A × r(1+r)^n / ((1+r)^n − 1)
 */
export function annuityPayment(
  principal: number,
  annualPercent: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualPercent <= 0) return roundMoney(principal / termMonths);
  const r = monthlyRateFromAnnual(annualPercent);
  const factor = Math.pow(1 + r, termMonths);
  return roundMoney((principal * r * factor) / (factor - 1));
}

/** Платёж при выдаче: всегда от исходного долга, не от остатка. */
export function contractualAnnuityPayment(input: {
  initialDebt: number;
  annualPercent: number;
  termMonths: number;
}): number {
  return annuityPayment(
    input.initialDebt,
    input.annualPercent,
    input.termMonths,
  );
}

function daysInMonthForCredit(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function parseIsoDateLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Сколько ежемесячных платежей прошло с даты выдачи.
 * Первый платёж — в следующем месяце после выдачи (как в банке).
 */
export function creditMonthsPaid(input: {
  startDate: string;
  paymentDay: number;
  asOf?: Date;
}): number {
  const start = parseIsoDateLocal(input.startDate);
  if (!start) return 0;
  const paymentDay = Math.min(31, Math.max(1, input.paymentDay));
  const asOf = input.asOf ?? new Date();
  const asOfDay = new Date(
    asOf.getFullYear(),
    asOf.getMonth(),
    asOf.getDate(),
  );

  let year = start.getFullYear();
  let month = start.getMonth() + 1;
  if (month > 11) {
    month = 0;
    year += 1;
  }
  // Выдача после дня платежа → первый платёж ещё через месяц
  if (start.getDate() > paymentDay) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  let count = 0;
  for (let i = 0; i < 600; i++) {
    const payDate = new Date(
      year,
      month,
      Math.min(paymentDay, daysInMonthForCredit(year, month)),
    );
    if (payDate.getTime() > asOfDay.getTime()) break;
    count += 1;
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return count;
}

/** Оставшийся срок по графику: полный срок минус прошедшие платежи. */
export function creditRemainingMonthsFromSchedule(input: {
  startDate: string;
  termMonths: number;
  paymentDay: number;
  asOf?: Date;
}): number {
  if (input.termMonths <= 0) return 0;
  const paid = creditMonthsPaid({
    startDate: input.startDate,
    paymentDay: input.paymentDay,
    asOf: input.asOf,
  });
  return Math.max(0, input.termMonths - paid);
}

/** Кредит уже платится (выдача была больше месяца назад). */
export function isExistingCreditLoan(
  startDate: string | null | undefined,
  asOf: Date = new Date(),
): boolean {
  if (!startDate) return false;
  const start = parseIsoDateLocal(startDate);
  if (!start) return false;
  const cutoff = new Date(
    asOf.getFullYear(),
    asOf.getMonth() - 1,
    asOf.getDate(),
  );
  return start.getTime() < cutoff.getTime();
}

/** Точный (дробный) остаток срока по формуле NPER. */
export function exactMonthsLeftWithInterest(
  remainingDebt: number,
  monthlyPayment: number,
  annualPercent: number,
): number | null {
  if (remainingDebt <= 0) return 0;
  if (monthlyPayment <= 0) return null;
  if (annualPercent <= 0) {
    return remainingDebt / monthlyPayment;
  }
  const r = monthlyRateFromAnnual(annualPercent);
  const interestOnly = remainingDebt * r;
  if (monthlyPayment <= interestOnly + 0.0001) return null;
  return (
    Math.log(monthlyPayment / (monthlyPayment - remainingDebt * r)) /
    Math.log(1 + r)
  );
}

/**
 * Целое число оставшихся платежей в графике (для отображения).
 * floor(NPER): 52.15 → 52.
 */
export function monthsLeftWithInterest(
  remainingDebt: number,
  monthlyPayment: number,
  annualPercent: number,
): number | null {
  const exact = exactMonthsLeftWithInterest(
    remainingDebt,
    monthlyPayment,
    annualPercent,
  );
  if (exact == null) return null;
  if (exact <= 0) return 0;
  return Math.max(1, Math.floor(exact + 1e-9));
}

/**
 * Срок для пересчёта аннуитета при досрочке «снизить платёж».
 *
 * Банки считают новый платёж на число полных оставшихся периодов
 * до даты окончания. При дробном NPER (например 52.15) это обычно
 * floor(NPER) − 1 относительно «текущего» неполного месяца —
 * на данных 1 206 338.93 / 34 736.67 / 19.9% → 51 мес.
 */
export function scheduleMonthsForPaymentRecalc(
  remainingDebt: number,
  monthlyPayment: number,
  annualPercent: number,
): number | null {
  const exact = exactMonthsLeftWithInterest(
    remainingDebt,
    monthlyPayment,
    annualPercent,
  );
  if (exact == null) return null;
  if (exact <= 0) return 0;
  const floor = Math.floor(exact + 1e-9);
  const frac = exact - floor;
  if (frac < 0.02) return Math.max(1, floor);
  return Math.max(1, floor - 1);
}

/**
 * Срок для пересчёта платежа при досрочке «снизить платёж».
 * Приоритет: график по дате выдачи → сохранённое → NPER.
 */
export function resolveRemainingMonthsForRecalc(
  remainingDebt: number,
  monthlyPayment: number,
  annualPercent: number,
  storedRemaining?: number | null,
  schedule?: {
    startDate: string;
    termMonths: number;
    paymentDay: number;
    asOf?: Date;
  } | null,
): number | null {
  if (
    schedule?.startDate &&
    schedule.termMonths > 0 &&
    schedule.paymentDay > 0
  ) {
    const left = creditRemainingMonthsFromSchedule({
      startDate: schedule.startDate,
      termMonths: schedule.termMonths,
      paymentDay: schedule.paymentDay,
      asOf: schedule.asOf,
    });
    if (left > 0) return left;
  }
  if (storedRemaining != null && storedRemaining > 0) {
    return Math.max(1, Math.round(storedRemaining));
  }
  return scheduleMonthsForPaymentRecalc(
    remainingDebt,
    monthlyPayment,
    annualPercent,
  );
}

/** Сколько платежей осталось при текущем платеже (NPER). Для «сократить срок». */
export function creditPayoffMonthsLeft(
  remainingDebt: number,
  monthlyPayment: number,
  annualPercent: number,
): number | null {
  return monthsLeftWithInterest(remainingDebt, monthlyPayment, annualPercent);
}

export function creditMonthsLeft(
  remainingDebt: number,
  monthlyPayment: number,
  annualPercent?: number | null,
): number | null {
  if (remainingDebt <= 0) return 0;
  if (monthlyPayment <= 0) return null;
  if (annualPercent != null && annualPercent > 0) {
    return creditPayoffMonthsLeft(
      remainingDebt,
      monthlyPayment,
      annualPercent,
    );
  }
  return Math.ceil(remainingDebt / monthlyPayment);
}

/** Контекст графика кредита для расчётов. */
export function creditScheduleContext(
  asset: Asset,
  paymentDay: number | null | undefined,
  asOf?: Date,
): {
  startDate: string;
  termMonths: number;
  paymentDay: number;
  asOf?: Date;
} | null {
  if (
    !asset.credit_start_date ||
    !asset.credit_term_months ||
    !paymentDay
  ) {
    return null;
  }
  return {
    startDate: asset.credit_start_date,
    termMonths: asset.credit_term_months,
    paymentDay,
    asOf,
  };
}

/** Новый аннуитетный платёж, чтобы закрыть остаток за remainingMonths. */
export function paymentForRemainingTerm(
  remainingDebt: number,
  annualPercent: number,
  remainingMonths: number,
): number {
  return annuityPayment(remainingDebt, annualPercent, remainingMonths);
}

export interface CreditPlanStep {
  date: Date;
  payment: number;
  /** Часть платежа на проценты (0 для простого долга). */
  interest: number;
  /** Часть платежа в тело. */
  principal: number;
  balanceAfter: number;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function nextPaymentCursor(
  from: Date,
  paymentDay: number,
): { year: number; month: number } {
  let year = from.getFullYear();
  let month = from.getMonth();
  if (from.getDate() > paymentDay) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return { year, month };
}

/** Наивный план без процентов: каждый месяц −payment. */
export function buildSimpleClosingPlan(input: {
  remainingDebt: number;
  monthlyPayment: number;
  paymentDay: number;
  from?: Date;
  steps?: number;
}): CreditPlanStep[] {
  const {
    remainingDebt,
    monthlyPayment,
    paymentDay,
    from = new Date(),
    steps = 6,
  } = input;
  if (monthlyPayment <= 0 || remainingDebt <= 0) return [];

  const result: CreditPlanStep[] = [];
  let balance = remainingDebt;
  let { year, month } = nextPaymentCursor(from, paymentDay);

  while (result.length < steps && balance > 0) {
    const pay = Math.min(monthlyPayment, balance);
    balance = Math.max(0, roundMoney(balance - pay));
    result.push({
      date: new Date(
        year,
        month,
        Math.min(paymentDay, daysInMonth(year, month)),
      ),
      payment: pay,
      interest: 0,
      principal: pay,
      balanceAfter: balance,
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return result;
}

/** График с процентами (аннуитет). */
export function buildInterestClosingPlan(input: {
  remainingDebt: number;
  monthlyPayment: number;
  annualPercent: number;
  paymentDay: number;
  from?: Date;
  steps?: number;
}): CreditPlanStep[] {
  const {
    remainingDebt,
    monthlyPayment,
    annualPercent,
    paymentDay,
    from = new Date(),
    steps = 6,
  } = input;
  if (monthlyPayment <= 0 || remainingDebt <= 0 || annualPercent <= 0) {
    return [];
  }

  const r = monthlyRateFromAnnual(annualPercent);
  const result: CreditPlanStep[] = [];
  let balance = remainingDebt;
  let { year, month } = nextPaymentCursor(from, paymentDay);

  while (result.length < steps && balance > 0.005) {
    const interest = roundMoney(balance * r);
    const rawPay = Math.min(monthlyPayment, roundMoney(balance + interest));
    const principal = Math.min(roundMoney(rawPay - interest), balance);
    const pay = roundMoney(interest + principal);
    balance = Math.max(0, roundMoney(balance - principal));
    result.push({
      date: new Date(
        year,
        month,
        Math.min(paymentDay, daysInMonth(year, month)),
      ),
      payment: pay,
      interest,
      principal,
      balanceAfter: balance,
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return result;
}

/** Универсальный план: со ставкой или простой. */
export function buildCreditClosingPlan(input: {
  remainingDebt: number;
  monthlyPayment: number;
  paymentDay: number;
  annualPercent?: number | null;
  from?: Date;
  steps?: number;
}): CreditPlanStep[] {
  if (input.annualPercent != null && input.annualPercent > 0) {
    return buildInterestClosingPlan({
      remainingDebt: input.remainingDebt,
      monthlyPayment: input.monthlyPayment,
      annualPercent: input.annualPercent,
      paymentDay: input.paymentDay,
      from: input.from,
      steps: input.steps,
    });
  }
  return buildSimpleClosingPlan(input);
}

/**
 * После досрочного погашения `extra`:
 * - часть может уйти в набежавшие проценты (dueDay + onDate);
 * - reduce_term: платёж не меняется, срок короче;
 * - reduce_payment: срок сохраняется, платёж пересчитывается.
 */
export function applyEarlyRepayment(input: {
  remainingDebt: number;
  extraPayment: number;
  monthlyPayment: number;
  annualPercent: number;
  mode: CreditEarlyRepayMode;
  /** Оставшиеся месяцы до досрочки (для reduce_payment). */
  remainingMonths: number;
  dueDay?: number | null;
  onDate?: Date;
}): {
  newDebt: number;
  newPayment: number;
  newMonthsLeft: number | null;
  accrued: number;
  toPrincipal: number;
} {
  const { accrued, toPrincipal } = principalFromEarlyPayment({
    remainingDebt: input.remainingDebt,
    extraPayment: input.extraPayment,
    annualPercent: input.annualPercent,
    dueDay: input.dueDay,
    onDate: input.onDate,
  });
  const newDebt = roundMoney(Math.max(0, input.remainingDebt - toPrincipal));
  if (newDebt <= 0) {
    return {
      newDebt: 0,
      newPayment: 0,
      newMonthsLeft: 0,
      accrued,
      toPrincipal,
    };
  }

  if (input.mode === 'reduce_payment') {
    const months = Math.max(1, Math.round(input.remainingMonths));
    const newPayment = paymentForRemainingTerm(
      newDebt,
      input.annualPercent,
      months,
    );
    return {
      newDebt,
      newPayment,
      newMonthsLeft: months,
      accrued,
      toPrincipal,
    };
  }

  const newMonthsLeft = monthsLeftWithInterest(
    newDebt,
    input.monthlyPayment,
    input.annualPercent,
  );
  return {
    newDebt,
    newPayment: input.monthlyPayment,
    newMonthsLeft,
    accrued,
    toPrincipal,
  };
}

/** Превью досрочки для UI. */
export function previewEarlyRepayment(input: {
  asset: Asset;
  monthlyPayment: number;
  extraPayment: number;
  mode: CreditEarlyRepayMode;
  dueDay?: number | null;
  onDate?: Date;
}): {
  newDebt: number;
  newPayment: number;
  newMonthsLeft: number | null;
  /** Текущий срок (NPER) — для сравнения при reduce_term. */
  currentPayoffMonths: number | null;
  /** Остаток по договору — для reduce_payment. */
  contractMonthsLeft: number | null;
  accrued: number;
  toPrincipal: number;
} | null {
  const rate = input.asset.credit_annual_rate;
  if (rate == null || rate <= 0 || input.extraPayment <= 0) return null;
  if (input.monthlyPayment <= 0 && input.mode === 'reduce_term') return null;

  const schedule = creditScheduleContext(input.asset, input.dueDay, input.onDate);
  const contractMonthsLeft = schedule
    ? creditRemainingMonthsFromSchedule({
        startDate: schedule.startDate,
        termMonths: schedule.termMonths,
        paymentDay: schedule.paymentDay,
        asOf: schedule.asOf,
      })
    : null;
  const currentPayoffMonths = creditPayoffMonthsLeft(
    input.asset.current_amount,
    input.monthlyPayment,
    rate,
  );

  const months =
    input.mode === 'reduce_payment'
      ? resolveRemainingMonthsForRecalc(
          input.asset.current_amount,
          input.monthlyPayment,
          rate,
          input.asset.credit_remaining_months,
          schedule,
        )
      : null;

  if (input.mode === 'reduce_payment' && (months == null || months <= 0)) {
    return null;
  }

  const result = applyEarlyRepayment({
    remainingDebt: input.asset.current_amount,
    extraPayment: input.extraPayment,
    monthlyPayment: input.monthlyPayment,
    annualPercent: rate,
    mode: input.mode,
    remainingMonths: months ?? 1,
    dueDay: input.dueDay,
    onDate: input.onDate,
  });

  return {
    ...result,
    currentPayoffMonths,
    contractMonthsLeft,
  };
}

export function resolveCreditPayment(
  asset: Asset,
  expenses: Expense[],
): { amount: number; dueDay: number | null; expense: Expense | null } {
  const expense =
    asset.linked_expense_id != null
      ? (expenses.find((e) => e.id === asset.linked_expense_id) ?? null)
      : (expenses.find((e) => e.linked_asset_id === asset.id) ?? null);
  if (!expense) {
    return { amount: 0, dueDay: null, expense: null };
  }
  return {
    amount: expense.amount,
    dueDay: expense.due_day,
    expense,
  };
}

/** Проценты, набежавшие с последней даты платежа (act/365). */
export function accruedInterestSinceDueDay(input: {
  remainingDebt: number;
  annualPercent: number;
  dueDay: number | null | undefined;
  onDate?: Date;
}): number {
  const { remainingDebt, annualPercent, dueDay, onDate = new Date() } = input;
  if (
    remainingDebt <= 0 ||
    annualPercent <= 0 ||
    dueDay == null ||
    dueDay < 1
  ) {
    return 0;
  }
  const days = daysSinceLastDue(dueDay, onDate);
  if (days <= 0) return 0;
  return roundMoney(((remainingDebt * annualPercent) / 100 / 365) * days);
}

function daysSinceLastDue(dueDay: number, on: Date): number {
  let year = on.getFullYear();
  let month = on.getMonth();
  const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  let candidate = new Date(year, month, Math.min(dueDay, dim(year, month)));
  const onDay = new Date(on.getFullYear(), on.getMonth(), on.getDate());
  if (candidate.getTime() > onDay.getTime()) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    candidate = new Date(year, month, Math.min(dueDay, dim(year, month)));
  }
  return Math.round(
    (onDay.getTime() - candidate.getTime()) / (24 * 60 * 60 * 1000),
  );
}

/**
 * Сколько из досрочного взноса идёт в тело долга.
 * Сверх набежавших процентов — как в банке вне даты платежа.
 */
export function principalFromEarlyPayment(input: {
  remainingDebt: number;
  extraPayment: number;
  annualPercent: number;
  dueDay?: number | null;
  onDate?: Date;
}): { accrued: number; toPrincipal: number } {
  const accrued = accruedInterestSinceDueDay({
    remainingDebt: input.remainingDebt,
    annualPercent: input.annualPercent,
    dueDay: input.dueDay,
    onDate: input.onDate,
  });
  const toPrincipal = roundMoney(Math.max(0, input.extraPayment - accrued));
  return { accrued, toPrincipal };
}

/** @deprecated используйте buildCreditClosingPlan */
export { buildSimpleClosingPlan as buildNaiveClosingPlan };
