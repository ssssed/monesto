import { startOfDay } from '@/entities/report';

export interface GoalPaceInput {
  currentAmount: number;
  goalAmount: number;
  deadlineIso: string | null | undefined;
  today?: Date;
  /** Сколько зарплатных циклов в месяц (1 или 2). */
  cyclesPerMonth?: 1 | 2;
}

export interface GoalPaceResult {
  remaining: number;
  daysLeft: number | null;
  cyclesLeft: number | null;
  perCycle: number | null;
  headline: string;
  detail: string | null;
}

function formatRubShort(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
}

function countCyclesUntil(
  from: Date,
  to: Date,
  cyclesPerMonth: 1 | 2,
): number {
  if (to <= from) return 0;
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  const dayFactor = to.getDate() >= from.getDate() ? 1 : 0;
  const fullMonths = Math.max(0, months + dayFactor);
  return Math.max(1, fullMonths * cyclesPerMonth);
}

export function describeGoalPace(input: GoalPaceInput): GoalPaceResult | null {
  const goal = input.goalAmount;
  if (!(goal > 0)) return null;

  const remaining = Math.max(0, goal - input.currentAmount);
  if (remaining <= 0) {
    return {
      remaining: 0,
      daysLeft: null,
      cyclesLeft: null,
      perCycle: null,
      headline: 'Цель достигнута',
      detail: null,
    };
  }

  const today = startOfDay(input.today ?? new Date());
  const cyclesPerMonth = input.cyclesPerMonth ?? 2;
  const deadlineRaw = input.deadlineIso?.trim();

  if (!deadlineRaw) {
    return {
      remaining,
      daysLeft: null,
      cyclesLeft: null,
      perCycle: null,
      headline: `Осталось ${formatRubShort(remaining)}`,
      detail: 'Укажите дедлайн — покажем, сколько откладывать с каждой зарплаты',
    };
  }

  const deadline = startOfDay(new Date(`${deadlineRaw}T00:00:00`));
  if (Number.isNaN(deadline.getTime())) {
    return {
      remaining,
      daysLeft: null,
      cyclesLeft: null,
      perCycle: null,
      headline: `Осталось ${formatRubShort(remaining)}`,
      detail: null,
    };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / msPerDay));

  if (daysLeft === 0) {
    return {
      remaining,
      daysLeft: 0,
      cyclesLeft: 0,
      perCycle: remaining,
      headline: `До цели ${formatRubShort(remaining)} — дедлайн сегодня`,
      detail: 'Успейте пополнить до конца дня',
    };
  }

  const cyclesLeft = countCyclesUntil(today, deadline, cyclesPerMonth);
  const perCycle = Math.ceil(remaining / cyclesLeft);

  return {
    remaining,
    daysLeft,
    cyclesLeft,
    perCycle,
    headline: `До цели ${formatRubShort(remaining)}`,
    detail: `По ~${formatRubShort(perCycle)} с каждой зарплаты · ${cyclesLeft} ${cyclesLeft === 1 ? 'цикл' : cyclesLeft < 5 ? 'цикла' : 'циклов'} · ${daysLeft} дн.`,
  };
}
