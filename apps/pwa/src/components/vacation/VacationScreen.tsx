import { Card } from '@monesto/rune';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PageHeader, PageTitle } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { FadeIn } from '@/components/ui/FadeIn';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import * as db from '@/lib/db';
import { findPrimaryIncome, scheduleDaysFromPrimary } from '@/lib/report/dateWindow';
import {
  averageWorkingDaysPerMonth,
  calculateVacationPayout,
  calendarDaysInclusive,
  normalizeVacationRange,
  parseIsoDate,
  toIsoDate,
  vacationDayRate,
} from '@/lib/report/vacation';
import type { VacationPeriod } from '@/lib/types';
import { formatRub } from '@/lib/utils/format';

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const formShell =
  'mx-auto flex h-full min-h-0 w-full flex-col px-5 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]';
const formScroll =
  'min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-4';

type DraftPeriod = { start_date: string; end_date: string };

function formatPeriodLabel(start: string, end: string): string {
  const from = parseIsoDate(start);
  const to = parseIsoDate(end);
  const monthName = MONTHS[from.getMonth()]!.toLowerCase();

  if (from.getTime() === to.getTime()) {
    return `${from.getDate()} ${monthName}`;
  }

  if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
    return `${from.getDate()}–${to.getDate()} ${monthName}`;
  }

  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${from.toLocaleDateString('ru-RU', opts)} – ${to.toLocaleDateString('ru-RU', opts)}`;
}

function isInPeriod(iso: string, period: DraftPeriod): boolean {
  return iso >= period.start_date && iso <= period.end_date;
}

function monthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function periodDays(period: DraftPeriod): number {
  return calendarDaysInclusive(
    parseIsoDate(period.start_date),
    parseIsoDate(period.end_date),
  );
}

function periodWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'период';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'периода';
  return 'периодов';
}

export function VacationScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [periods, setPeriods] = useState<DraftPeriod[] | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [scheduleDays, setScheduleDays] = useState<number[]>([10, 25]);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const persistReady = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.all([db.getAllVacations(), db.getAllIncomes()]).then(
      ([vacations, incomes]) => {
        setPeriods(
          vacations.map((v) => ({
            start_date: v.start_date,
            end_date: v.end_date,
          })),
        );
        const primary = findPrimaryIncome(incomes);
        setMonthlyAmount(primary?.monthly_amount ?? primary?.amount ?? 0);
        if (primary) {
          setScheduleDays(scheduleDaysFromPrimary(primary));
        }
        // Skip first persist after load
        requestAnimationFrame(() => {
          persistReady.current = true;
        });
      },
    );
  }, []);

  const persist = useCallback((next: DraftPeriod[]) => {
    if (!persistReady.current) return;
    void db.replaceAllVacations(next);
  }, []);

  const avgDays = useMemo(() => averageWorkingDaysPerMonth(year), [year]);
  const dayRate = useMemo(
    () => vacationDayRate(monthlyAmount, year),
    [monthlyAmount, year],
  );

  const yearPeriods = useMemo(() => {
    if (!periods) return [];
    return periods.filter(
      (p) =>
        p.start_date.startsWith(String(year)) ||
        p.end_date.startsWith(String(year)),
    );
  }, [periods, year]);

  const totalDays = useMemo(
    () => yearPeriods.reduce((n, p) => n + periodDays(p), 0),
    [yearPeriods],
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const removePeriod = (indexInYear: number) => {
    if (!periods) return;
    const target = yearPeriods[indexInYear];
    if (!target) return;
    const next = periods.filter(
      (p) =>
        !(p.start_date === target.start_date && p.end_date === target.end_date),
    );
    setPeriods(next);
    persist(next);
    setRangeStart(null);
  };

  const onDayClick = (date: Date) => {
    if (!periods) return;
    const iso = toIsoDate(date);

    if (!rangeStart) {
      setRangeStart(iso);
      return;
    }

    const draft = normalizeVacationRange(rangeStart, iso);
    const overlap = periods.some(
      (p) => draft.start_date <= p.end_date && draft.end_date >= p.start_date,
    );
    if (!overlap) {
      const next = [...periods, draft];
      setPeriods(next);
      persist(next);
      const key = `${draft.start_date}-${draft.end_date}`;
      setJustAddedKey(key);
      requestAnimationFrame(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      window.setTimeout(() => setJustAddedKey(null), 700);
    }
    setRangeStart(null);
  };

  if (!periods) {
    return (
      <main className={formShell}>
        <p className="text-slate-400">Загрузка…</p>
      </main>
    );
  }

  const cells = monthCells(year, month);

  return (
    <PageTransition fill>
      <main className={formShell}>
        <PageHeader title="Отпуск" backTo="/settings" />
        <PageTitle
          title="Отпуска"
          subtitle="Отметьте периоды — отпускные придут примерно за неделю до начала"
        />

        <div className={formScroll}>
          <FadeIn>
            <div className="grid grid-cols-2 gap-3">
              <Card className="overflow-hidden border-slate-100 p-0 shadow-sm">
                <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50/50 px-3.5 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700/70">
                    1 день отпуска
                  </p>
                  <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-slate-900">
                    {monthlyAmount > 0 ? formatRub(Math.round(dayRate)) : '—'}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-slate-400">
                    оклад ÷ {avgDays.toFixed(1)} р.д.
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden border-slate-100 p-0 shadow-sm">
                <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50/60 px-3.5 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700/70">
                    Выбрано дней
                  </p>
                  <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-slate-900">
                    {totalDays}
                    <span className="ml-1 text-sm font-semibold text-slate-400">
                      дн.
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-slate-400">
                    {yearPeriods.length
                      ? `${yearPeriods.length} ${periodWord(yearPeriods.length)} · ${year}`
                      : `пока пусто · ${year}`}
                  </p>
                </div>
              </Card>
            </div>
          </FadeIn>

          <FadeIn index={1}>
            <Card className="border-slate-100 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600"
                  aria-label="Предыдущий месяц"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <p className="text-[15px] font-bold text-slate-900">
                    {MONTHS[month]} {year}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {rangeStart
                      ? 'Выберите конец периода'
                      : 'Нажмите начало, затем конец'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600"
                  aria-label="Следующий месяц"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((date, i) => {
                  if (!date) {
                    return <div key={`e-${i}`} className="aspect-square" />;
                  }
                  const iso = toIsoDate(date);
                  const inVacation = periods.some((p) => isInPeriod(iso, p));
                  const isStart = rangeStart === iso;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => onDayClick(date)}
                      className={[
                        'aspect-square rounded-xl text-sm font-semibold transition-all duration-150',
                        inVacation
                          ? 'bg-[var(--color-primary)]/12 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20'
                          : isStart
                            ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] ring-2 ring-[var(--color-primary)]/40'
                            : isWeekend
                              ? 'text-slate-400 hover:bg-slate-50'
                              : 'text-slate-800 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {rangeStart ? (
                <button
                  type="button"
                  onClick={() => setRangeStart(null)}
                  className="mt-3 w-full text-center text-xs font-medium text-slate-400"
                >
                  Отменить выбор
                </button>
              ) : null}
            </Card>
          </FadeIn>

          <div ref={listRef} className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <p className="text-sm font-semibold text-slate-900">
                Периоды {year}
              </p>
              {yearPeriods.length ? (
                <p className="text-[11px] text-slate-400">свайп влево — удалить</p>
              ) : null}
            </div>

            {!yearPeriods.length ? (
              <div
                key="empty"
                className="animate-in fade-in-0 zoom-in-95 duration-300 ease-out"
              >
                <Card className="border-dashed border-slate-200 bg-white/60 p-5 text-center shadow-none">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Plus className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Выберите даты в календаре
                  </p>
                  <p className="mt-1 text-xs leading-snug text-slate-400">
                    Зарплата за дни отпуска не дублируется — отпускные приходят
                    заранее
                  </p>
                </Card>
              </div>
            ) : (
              <div
                key="list"
                className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out"
              >
                {yearPeriods.map((period, index) => {
                  const key = `${period.start_date}-${period.end_date}`;
                  const fake: VacationPeriod = {
                    id: index,
                    start_date: period.start_date,
                    end_date: period.end_date,
                  };
                  const payout =
                    monthlyAmount > 0
                      ? calculateVacationPayout(
                          fake,
                          monthlyAmount,
                          scheduleDays,
                        )
                      : null;
                  const isNew = justAddedKey === key;

                  return (
                    <div
                      key={key}
                      className={
                        isNew
                          ? 'animate-in fade-in-0 slide-in-from-bottom-3 zoom-in-95 duration-500 ease-out'
                          : undefined
                      }
                    >
                      <SwipeToDelete
                        borderRadius={16}
                        onDelete={() => removePeriod(index)}
                      >
                        <Card className="border-0 p-4 shadow-none">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-amber-700">
                              {periodDays(period)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">
                                {formatPeriodLabel(
                                  period.start_date,
                                  period.end_date,
                                )}
                              </p>
                              {payout ? (
                                <p className="mt-0.5 text-sm text-slate-400">
                                  {formatRub(payout.amount)} · выплата около{' '}
                                  {payout.paymentDate.toLocaleDateString(
                                    'ru-RU',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                    },
                                  )}
                                </p>
                              ) : (
                                <p className="mt-0.5 text-sm text-slate-400">
                                  Укажите зарплату в доходах для расчёта
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </SwipeToDelete>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
