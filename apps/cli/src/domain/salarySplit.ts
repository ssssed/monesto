/** День месяца выплаты зарплаты. */
const SALARY_PAY_DAY = 10;
/** День месяца выплаты аванса. */
const ADVANCE_PAY_DAY = 25;

const DEFAULT_ADVANCE_START_DAY = 1;
const DEFAULT_ADVANCE_END_DAY = 15;

/** Нерабочие праздничные дни РФ (месяц 1–12, день). По производственному календарю. */
const RU_HOLIDAYS: ReadonlyArray<{ month: number; day: number }> = [
  { month: 1, day: 1 },
  { month: 1, day: 2 },
  { month: 1, day: 7 },
  { month: 2, day: 23 },
  { month: 3, day: 8 },
  { month: 5, day: 1 },
  { month: 5, day: 9 },
  { month: 6, day: 12 },
  { month: 11, day: 4 }
];

export interface WorkdaysInfo {
  total: number;
  /** Рабочие дни в текущем месяце за период аванса (advanceStartDay–advanceEndDay). */
  imprest: number;
  /** Рабочие дни в прошлом месяце за хвост (advanceEndDay+1 – конец). */
  salary: number;
}

/** Период аванса в текущем месяце (дни с advanceStart по advanceEnd включительно). */
export interface AdvancePeriod {
  start: number;
  end: number;
}

export interface SalarySplitResult {
  imprestAmount: number;
  salaryAmount: number;
  imprestDate: Date;
  salaryDate: Date;
  workdays: WorkdaysInfo;
  /** Период аванса: с advanceStart по advanceEnd число текущего месяца. */
  advancePeriod: AdvancePeriod;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isHoliday(year: number, month1Based: number, day: number): boolean {
  return RU_HOLIDAYS.some((h) => h.month === month1Based && h.day === day);
}

function isWorkday(year: number, month1Based: number, day: number): boolean {
  const d = new Date(year, month1Based - 1, day);
  if (isWeekend(d)) return false;
  if (isHoliday(year, month1Based, day)) return false;
  return true;
}

function getLastDayOfMonth(year: number, monthIndex0Based: number): number {
  return new Date(year, monthIndex0Based + 1, 0).getDate();
}

/** Рабочие дни в диапазоне с учётом выходных и праздников РФ. */
function countWorkdaysInRange(year: number, month1Based: number, startDay: number, endDay: number): number {
  let count = 0;
  for (let day = startDay; day <= endDay; day++) {
    if (isWorkday(year, month1Based, day)) count++;
  }
  return count;
}

/**
 * Делит месячный чистый доход на две выплаты:
 * - 10-е текущего месяца — зарплата за рабочие дни (advanceEndDay+1)–конец прошлого месяца;
 * - 25-е текущего месяца — аванс за рабочие дни advanceStartDay–advanceEndDay текущего месяца.
 */
export function splitNetIncomeByWorkdays(params: {
  netIncome: number;
  year: number;
  /** Текущий месяц (1–12), например 3 для марта. */
  month: number;
  /** Первый день периода аванса в текущем месяце (по умолчанию 1). */
  advanceStartDay?: number;
  /** Последний день периода аванса в текущем месяце (по умолчанию 15). Хвост зарплаты в прошлом месяце: (advanceEndDay+1)–конец. */
  advanceEndDay?: number;
}): SalarySplitResult {
  const {
    netIncome,
    year,
    month,
    advanceStartDay = DEFAULT_ADVANCE_START_DAY,
    advanceEndDay = DEFAULT_ADVANCE_END_DAY
  } = params;

  if (!Number.isFinite(netIncome) || netIncome < 0) {
    throw new Error('netIncome must be a non-negative number');
  }

  const currMonthIndex0 = month - 1;
  if (currMonthIndex0 < 0 || currMonthIndex0 > 11) {
    throw new Error('month must be in range 1-12');
  }

  if (advanceStartDay < 1 || advanceEndDay < advanceStartDay) {
    throw new Error('advanceStartDay и advanceEndDay должны быть 1–31, advanceEndDay >= advanceStartDay');
  }

  const prevMonthIndex0 = currMonthIndex0 === 0 ? 11 : currMonthIndex0 - 1;
  const prevYear = currMonthIndex0 === 0 ? year - 1 : year;

  const prevMonth1 = prevMonthIndex0 + 1;
  const prevLastDay = getLastDayOfMonth(prevYear, prevMonthIndex0);
  const prevTailStartDay = advanceEndDay + 1;
  const salaryWorkdays =
    prevTailStartDay <= prevLastDay
      ? countWorkdaysInRange(prevYear, prevMonth1, prevTailStartDay, prevLastDay)
      : 0;
  const prevMonthTotalWorkdays = countWorkdaysInRange(prevYear, prevMonth1, 1, prevLastDay);

  const currMonth1 = currMonthIndex0 + 1;
  const currLastDay = getLastDayOfMonth(year, currMonthIndex0);
  const advanceEndDayClamped = Math.min(advanceEndDay, currLastDay);
  const advanceWorkdays = countWorkdaysInRange(year, currMonth1, advanceStartDay, advanceEndDayClamped);
  const currMonthTotalWorkdays = countWorkdaysInRange(year, currMonth1, 1, currLastDay);

  const salaryAmount =
    prevMonthTotalWorkdays > 0 ? (netIncome * salaryWorkdays) / prevMonthTotalWorkdays : 0;

  const imprestAmount =
    currMonthTotalWorkdays > 0 ? (netIncome * advanceWorkdays) / currMonthTotalWorkdays : 0;

  return {
    imprestAmount,
    salaryAmount,
    imprestDate: new Date(year, currMonthIndex0, ADVANCE_PAY_DAY),
    salaryDate: new Date(year, currMonthIndex0, SALARY_PAY_DAY),
    workdays: {
      total: salaryWorkdays + advanceWorkdays,
      imprest: advanceWorkdays,
      salary: salaryWorkdays
    },
    advancePeriod: { start: advanceStartDay, end: advanceEndDay }
  };
}

