import {
  Badge,
  Button,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SlidingToggleGroup,
  cn,
} from '@monesto/rune';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';

import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { UndoToast } from '@/components/ui/UndoToast';
import {
  calculateSalaryPaymentAmount,
  createDefaultTranche,
  createEmptyBimonthlyTranches,
  detectSalarySchedulePreset,
  normalizeSalaryTranches,
  tranchesFromPreset,
  type SalarySchedulePresetId,
} from '@/lib/report/calculateSalaryPayment';
import type { Asset, MoneyFlowEntry, SalaryPaymentDay, SalaryTranche } from '@/lib/types';
import {
  createEmptyExpenseEntry,
  createEmptyIncomeEntry,
  formatRub,
} from '@/lib/utils/format';
import * as db from '@/lib/db';

type Mode = 'income' | 'expense';

const SCHEDULE_PRESETS: {
  id: Exclude<SalarySchedulePresetId, 'custom'>;
  title: string;
  hint: string;
  payments: { day: number; label: string; period: string }[];
}[] = [
  {
    id: '10-25',
    title: '10-го и 25-го',
    hint: 'Самый частый график в РФ',
    payments: [
      {
        day: 10,
        label: 'Аванс',
        period: 'за 16–31 прошлого месяца',
      },
      {
        day: 25,
        label: 'Зарплата',
        period: 'за 1–15 текущего месяца',
      },
    ],
  },
  {
    id: '5-20',
    title: '5-го и 20-го',
    hint: 'Тот же смысл, другие даты',
    payments: [
      {
        day: 5,
        label: 'Аванс',
        period: 'за 16–31 прошлого месяца',
      },
      {
        day: 20,
        label: 'Зарплата',
        period: 'за 1–15 текущего месяца',
      },
    ],
  },
];


function dayInput(value: number | string | undefined): string {
  if (value == null || value === '') return '';
  return String(value);
}

function parseDay(raw: string, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(31, Math.max(1, Math.round(n)));
}

/** Ввод дня месяца: пусто или 1–31. */
function clampDayField(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n)) return '';
  return String(Math.min(31, Math.max(1, Math.round(n))));
}

function isValidMonthDay(raw: string | undefined): boolean {
  const day = Number(raw);
  return Boolean(raw?.trim()) && Number.isFinite(day) && day >= 1 && day <= 31;
}

function formatTranchesPreview(tranches: SalaryTranche[]): string {
  const normalized = normalizeSalaryTranches(tranches);
  return normalized
    .map((t) => {
      const month = t.periodMonthOffset === -1 ? 'прошл.' : 'тек.';
      return `${t.paymentDay}-е ← ${t.periodFromDay}–${t.periodToDay} (${month})`;
    })
    .join(' · ');
}

function SchedulePresetPicker({
  activeId,
  onSelect,
}: {
  activeId: SalarySchedulePresetId;
  onSelect: (id: Exclude<SalarySchedulePresetId, 'custom'>) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Дни выплат
        </Label>
        <p className="mt-1 text-[12px] leading-4 text-slate-400">
          Зарплату платят дважды в месяц — выберите ваши даты
        </p>
      </div>
      <div className="space-y-2.5">
        {SCHEDULE_PRESETS.map((preset) => {
          const active = activeId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              className={cn(
                'w-full rounded-2xl border p-3.5 text-left transition-all duration-200',
                active
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50',
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[15px] font-bold leading-5',
                      active ? 'text-blue-700' : 'text-slate-900',
                    )}
                  >
                    {preset.title}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-[11px] leading-4',
                      active ? 'text-blue-600/70' : 'text-slate-400',
                    )}
                  >
                    {preset.hint}
                  </p>
                </div>
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    active
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white',
                  )}
                >
                  {active ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : null}
                </span>
              </div>

              <div
                className={cn(
                  'space-y-2 rounded-xl px-3 py-2.5',
                  active ? 'bg-white/80' : 'bg-slate-50',
                )}
              >
                {preset.payments.map((payment) => (
                  <div
                    key={payment.day}
                    className="flex items-start gap-2.5"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold',
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 ring-1 ring-slate-200',
                      )}
                    >
                      {payment.day}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p
                        className={cn(
                          'text-[13px] font-semibold leading-4',
                          active ? 'text-slate-900' : 'text-slate-800',
                        )}
                      >
                        {payment.label}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-[11px] leading-4',
                          active ? 'text-slate-500' : 'text-slate-400',
                        )}
                      >
                        {payment.period}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function previewLine(entry: MoneyFlowEntry, mode: Mode): string {
  if (entry.isBimonthlySalary) {
    const monthly = Number(entry.monthlyAmount ?? entry.amount ?? 0);
    const preset = detectSalarySchedulePreset(entry.salaryTranches);
    const schedule =
      preset === '10-25'
        ? '10 и 25 числа'
        : preset === '5-20'
          ? '5 и 20 числа'
          : formatTranchesPreview(
              entry.salaryTranches ?? createEmptyBimonthlyTranches(),
            );
    return monthly ? `${formatRub(monthly)} / мес · ${schedule}` : schedule;
  }
  if (entry.isOneTime) {
    const amount = Number(entry.amount || 0);
    const date = entry.specificDate || 'дата не указана';
    return amount ? `${formatRub(amount)} · ${date}` : date;
  }
  const amount = Number(entry.amount || 0);
  const day = mode === 'income' ? entry.paymentDay : entry.dueDay;
  const dayLabel = day ? `${day}-е` : 'день?';
  return amount ? `${formatRub(amount)} · ${dayLabel}` : dayLabel;
}

function MoneyFlowSummary({
  mode,
  entries,
}: {
  mode: Mode;
  entries: MoneyFlowEntry[];
}) {
  const filled = entries.filter((entry) => entry.name.trim());
  const isIncome = mode === 'income';

  const monthlyTotal =
    mode === 'income'
      ? entries.reduce((sum, entry) => {
          if (entry.isOneTime) return sum;
          if (entry.isBimonthlySalary) {
            return sum + Number(entry.monthlyAmount ?? entry.amount ?? 0);
          }
          return sum + Number(entry.amount || 0);
        }, 0)
      : entries.reduce((sum, entry) => {
          if (entry.isOneTime) return sum;
          return sum + Number(entry.amount || 0);
        }, 0);

  const oneTimeTotal = entries.reduce((sum, entry) => {
    if (!entry.isOneTime) return sum;
    return sum + Number(entry.amount || 0);
  }, 0);

  let hint: string | null = null;
  const salary = entries.find(
    (entry) => entry.isBimonthlySalary && entry.name.trim(),
  );
  if (salary) {
    const monthly = Number(salary.monthlyAmount ?? salary.amount);
    const tranches = normalizeSalaryTranches(salary.salaryTranches);
    if (monthly && tranches.length) {
      const now = new Date();
      const parts = tranches.map((tranche) => {
        const calc = calculateSalaryPaymentAmount(
          monthly,
          tranche.paymentDay,
          new Date(now.getFullYear(), now.getMonth(), tranche.paymentDay),
          tranches,
        );
        return `${tranche.paymentDay}-е ≈ ${formatRub(calc.amount)}`;
      });
      hint = `Выплаты: ${parts.join(' · ')}`;
    }
  }

  return (
    <div className="rounded-2xl bg-[var(--color-navy)] p-5 text-white shadow-lg">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {isIncome ? 'Доходы за месяц' : 'Расходы за месяц'}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {formatRub(monthlyTotal)}
          </p>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
            Записей
          </p>
          <p className="text-lg font-bold">{filled.length}</p>
        </div>
      </div>
      {oneTimeTotal > 0 ? (
        <p className="mt-3 text-xs text-white/45">
          + разовые {formatRub(oneTimeTotal)}
        </p>
      ) : null}
      {hint ? (
        <p className="mt-2 text-xs leading-4 text-white/45">{hint}</p>
      ) : null}
    </div>
  );
}

function TrancheEditor({
  tranche,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  tranche: SalaryTranche;
  index: number;
  canRemove: boolean;
  onChange: (next: SalaryTranche) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Выплата {index + 1}
        </p>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-red-500"
          >
            Удалить
          </button>
        ) : null}
      </div>

      <div className="mb-3">
        <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          День выплаты
        </Label>
        <Input
          className="border-slate-100 bg-white text-center"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          step={1}
          value={dayInput(tranche.paymentDay)}
          onChange={(e) =>
            onChange({
              ...tranche,
              paymentDay: parseDay(e.target.value, tranche.paymentDay),
            })
          }
          placeholder="1–31"
        />
      </div>

      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Период работы
      </p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1 text-[10px] text-slate-400">С числа</Label>
          <Input
            className="border-slate-100 bg-white text-center"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            step={1}
            value={dayInput(tranche.periodFromDay)}
            onChange={(e) =>
              onChange({
                ...tranche,
                periodFromDay: parseDay(e.target.value, tranche.periodFromDay),
              })
            }
          />
        </div>
        <div>
          <Label className="mb-1 text-[10px] text-slate-400">По число</Label>
          <Input
            className="border-slate-100 bg-white text-center"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            step={1}
            value={dayInput(tranche.periodToDay)}
            onChange={(e) =>
              onChange({
                ...tranche,
                periodToDay: parseDay(e.target.value, tranche.periodToDay),
              })
            }
          />
        </div>
      </div>

      <SlidingToggleGroup
        size="sm"
        value={tranche.periodMonthOffset === -1 ? 'prev' : 'current'}
        onValueChange={(key) =>
          onChange({
            ...tranche,
            periodMonthOffset: key === 'prev' ? -1 : 0,
          })
        }
        options={[
          { value: 'prev', label: 'Прошлый месяц' },
          { value: 'current', label: 'Этот месяц' },
        ]}
      />
      <p className="mt-2 text-[11px] leading-4 text-slate-400">
        Сумма = оклад × (раб. дни периода / раб. дни месяца периода)
      </p>
    </div>
  );
}

function EntryRow({
  entry,
  mode,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
  canRemove,
  onPresetApplied,
  creditAssets,
}: {
  entry: MoneyFlowEntry;
  mode: Mode;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (entry: MoneyFlowEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
  onPresetApplied?: () => void;
  creditAssets: Asset[];
}) {
  const update = (patch: Partial<MoneyFlowEntry>) =>
    onChange({ ...entry, ...patch });
  const isIncome = mode === 'income';
  const title =
    entry.name.trim() ||
    (isIncome ? `Доход ${index + 1}` : `Расход ${index + 1}`);
  const linkedCredit = creditAssets.find(
    (a) => String(a.id) === entry.linkedAssetId,
  );

  const scheduleKey = entry.isOneTime
    ? 'one_time'
    : entry.isBimonthlySalary
      ? 'periods'
      : 'monthly';

  const tranches = normalizeSalaryTranches(
    entry.salaryTranches ?? createEmptyBimonthlyTranches(),
  );
  const trancheCount = entry.isBimonthlySalary
    ? Math.min(2, Math.max(1, entry.salaryTranches?.length ?? 2))
    : 2;

  const detectedPreset = detectSalarySchedulePreset(entry.salaryTranches);
  const [manualOverride, setManualOverride] = useState(
    () => detectedPreset === 'custom',
  );
  const [pickingCredit, setPickingCredit] = useState(false);
  const activePreset: SalarySchedulePresetId = manualOverride
    ? 'custom'
    : detectedPreset;
  const showManualEditors = activePreset === 'custom';

  useEffect(() => {
    if (!expanded) setPickingCredit(false);
  }, [expanded]);

  const setTranches = (next: SalaryTranche[]) => {
    const normalized = normalizeSalaryTranches(next);
    const primary =
      entry.primaryPaymentDay &&
      normalized.some((t) => t.paymentDay === entry.primaryPaymentDay)
        ? entry.primaryPaymentDay
        : normalized[normalized.length - 1]?.paymentDay;
    setManualOverride(true);
    update({
      salaryTranches: normalized,
      primaryPaymentDay: primary,
    });
  };

  const applyPreset = (id: Exclude<SalarySchedulePresetId, 'custom'>) => {
    if (!manualOverride && detectedPreset === id) {
      setManualOverride(true);
      return;
    }

    const next = tranchesFromPreset(id);
    const laterDay = Math.max(...next.map((t) => t.paymentDay));
    setManualOverride(false);
    update({
      isBimonthlySalary: true,
      isOneTime: false,
      salaryTranches: next,
      primaryPaymentDay: laterDay as SalaryPaymentDay,
    });
    window.setTimeout(() => onPresetApplied?.(), 80);
  };

  const toneSoft = isIncome
    ? 'bg-[var(--color-income-soft)] text-[var(--color-income)]'
    : 'bg-[var(--color-expense-soft)] text-[var(--color-expense)]';
  const toneRing = isIncome
    ? 'ring-[var(--color-income)]/20'
    : 'ring-[var(--color-expense)]/20';
  const toneMoneyText = isIncome
    ? 'text-[var(--color-income)]'
    : 'text-[var(--color-expense)]';

  return (
    <SwipeToDelete
      enabled={canRemove && !expanded}
      onDelete={onRemove}
      borderRadius={16}
      className="mb-3"
    >
      <div
        className={cn(
          'overflow-hidden rounded-2xl bg-white ring-1 transition-colors',
          expanded ? toneRing : 'ring-slate-100',
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/70"
        >
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              toneSoft,
            )}
          >
            {isIncome ? (
              <ArrowDown className="h-[18px] w-[18px]" strokeWidth={2} />
            ) : (
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900">
                {title}
              </p>
              {entry.isPrimary ? (
                <Badge variant="soft" className="shrink-0 text-[10px]">
                  ОСН.
                </Badge>
              ) : null}
              {linkedCredit ? (
                <Badge
                  variant="soft"
                  className="shrink-0 text-[10px] text-rose-700"
                >
                  КРЕДИТ
                </Badge>
              ) : null}
            </div>
            <p className={cn('mt-0.5 truncate text-sm font-medium', toneMoneyText)}>
              {previewLine(entry, mode)}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="h-[18px] w-[18px] shrink-0 text-slate-300" />
          ) : (
            <ChevronDown className="h-[18px] w-[18px] shrink-0 text-slate-300" />
          )}
        </button>

        {expanded ? (
          <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-4">
            {/* Название — текстовое поле */}
            <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-100">
              <Label required className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Название
              </Label>
              <p className="mt-0.5 mb-2 text-[11px] leading-4 text-slate-400">
                {isIncome
                  ? 'Как называется поступление — зарплата, подработка, дивиденды'
                  : 'Как называется платёж — аренда, связь, кредит'}
              </p>
              <Input
                inputMode="text"
                autoComplete="off"
                value={entry.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={
                  isIncome ? 'Например, Зарплата' : 'Например, Аренда'
                }
              />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Тип
              </Label>
              <SlidingToggleGroup
                size="sm"
                value={entry.isOneTime ? 'one_time' : 'recurring'}
                onValueChange={(key) =>
                  update(
                    isIncome
                      ? {
                          isOneTime: key === 'one_time',
                          isBimonthlySalary:
                            key === 'one_time' ? false : entry.isBimonthlySalary,
                        }
                      : { isOneTime: key === 'one_time' },
                  )
                }
                options={
                  isIncome
                    ? [
                        { value: 'recurring', label: 'Регулярный' },
                        { value: 'one_time', label: 'Разовый' },
                      ]
                    : [
                        { value: 'recurring', label: 'Ежемесячный' },
                        { value: 'one_time', label: 'Разовый' },
                      ]
                }
              />
            </div>

            {isIncome && !entry.isOneTime ? (
              <div>
                <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  График
                </Label>
                <SlidingToggleGroup
                  size="sm"
                  value={scheduleKey === 'periods' ? 'periods' : 'monthly'}
                  onValueChange={(key) => {
                    if (key !== 'periods') {
                      update({
                        isBimonthlySalary: false,
                        isOneTime: false,
                      });
                      return;
                    }
                    const nextTranches = entry.salaryTranches?.length
                      ? entry.salaryTranches
                      : createEmptyBimonthlyTranches();
                    const laterDay = Math.max(
                      ...nextTranches.map((t) => t.paymentDay),
                    );
                    update({
                      isBimonthlySalary: true,
                      isOneTime: false,
                      salaryTranches: nextTranches,
                      primaryPaymentDay: laterDay as SalaryPaymentDay,
                    });
                  }}
                  options={[
                    { value: 'monthly', label: 'Фикс. день' },
                    { value: 'periods', label: 'По периодам' },
                  ]}
                />
                <p className="mt-2 text-[11px] leading-4 text-slate-400">
                  {scheduleKey === 'periods'
                    ? 'Два раза в месяц — пресет или ручная настройка'
                    : 'Одна сумма в выбранный день месяца'}
                </p>
              </div>
            ) : null}

            {/* Сумма — отдельный блок, чтобы не путали с названием */}
            <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
              <Label
                required
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {entry.isBimonthlySalary && isIncome
                  ? 'Оклад на руки / мес'
                  : 'Сумма в рублях'}
              </Label>
              <p className="mt-0.5 mb-2 text-[11px] leading-4 text-slate-400">
                {entry.isBimonthlySalary && isIncome
                  ? 'Месячный оклад до вычета расходов'
                  : isIncome
                    ? 'Сколько приходит за этот доход'
                    : 'Сколько уходит на этот платёж'}
              </p>
              <div>
                <Input
                  format="money"
                  suffix="₽"
                  withRelativeSuffix
                  className="border-0 bg-white text-lg font-bold shadow-none ring-1 ring-slate-200"
                  value={
                    entry.isBimonthlySalary && isIncome
                      ? (entry.monthlyAmount ?? entry.amount)
                      : entry.amount
                  }
                  onChange={(e) =>
                    entry.isBimonthlySalary && isIncome
                      ? update({
                          monthlyAmount: e.target.value,
                          amount: e.target.value,
                        })
                      : update({ amount: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              {!entry.isOneTime && !entry.isBimonthlySalary ? (
                <div className="mt-3">
                  <Label
                    required
                    className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    День месяца
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    step={1}
                    className="border-0 bg-white shadow-none ring-1 ring-slate-200"
                    value={
                      isIncome ? entry.paymentDay ?? '' : entry.dueDay ?? ''
                    }
                    onChange={(e) => {
                      const day = clampDayField(e.target.value);
                      update(
                        isIncome ? { paymentDay: day } : { dueDay: day },
                      );
                    }}
                    placeholder="1–31"
                  />
                </div>
              ) : null}

              {entry.isOneTime ? (
                <div className="mt-3">
                  <Label
                    required
                    className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Дата
                  </Label>
                  <DatePicker
                    className="border-0 bg-white shadow-none ring-1 ring-slate-200"
                    value={entry.specificDate ?? ''}
                    onChange={(e) => update({ specificDate: e.target.value })}
                  />
                </div>
              ) : null}
            </div>

            {isIncome && entry.isBimonthlySalary ? (
              <div className="space-y-3">
                <SchedulePresetPicker
                  activeId={activePreset}
                  onSelect={applyPreset}
                />

                {showManualEditors ? (
                  <>
                    <div>
                      <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Или настроить вручную
                      </Label>
                      <SlidingToggleGroup
                        size="sm"
                        value={String(trancheCount)}
                        onValueChange={(key) => {
                          if (key === '1') {
                            setTranches([
                              tranches[0] ?? createDefaultTranche(25),
                            ]);
                          } else {
                            setTranches(
                              tranches.length >= 2
                                ? tranches.slice(0, 2)
                                : createEmptyBimonthlyTranches(),
                            );
                          }
                        }}
                        options={[
                          { value: '1', label: '1 дата' },
                          { value: '2', label: '2 даты' },
                        ]}
                      />
                    </div>

                    {tranches.slice(0, trancheCount).map((tranche, i) => (
                      <TrancheEditor
                        key={`${i}-${tranche.paymentDay}`}
                        tranche={tranche}
                        index={i}
                        canRemove={trancheCount > 1}
                        onChange={(next) => {
                          const copy = [...tranches];
                          copy[i] = next;
                          setTranches(copy.slice(0, trancheCount));
                        }}
                        onRemove={() => {
                          setTranches([tranches[i === 0 ? 1 : 0]!]);
                        }}
                      />
                    ))}
                  </>
                ) : (
                  <p className="rounded-xl bg-blue-50 px-3.5 py-3 text-[12px] leading-4 text-blue-700/80">
                    Пресет выбран. Нажмите ещё раз, чтобы настроить даты
                    вручную.
                  </p>
                )}
              </div>
            ) : null}

            {isIncome ? (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const becomingPrimary = !entry.isPrimary;
                    if (!becomingPrimary) {
                      update({ isPrimary: false });
                      return;
                    }
                    // Готовые пресеты: ориентир всегда на позднюю выплату (20 / 25).
                    const laterDay = Math.max(
                      ...tranches.map((t) => t.paymentDay),
                      25,
                    );
                    update({
                      isPrimary: true,
                      primaryPaymentDay: (
                        showManualEditors
                          ? entry.primaryPaymentDay ?? laterDay
                          : laterDay
                      ) as SalaryPaymentDay,
                    });
                  }}
                  className={cn(
                    'flex w-full items-center rounded-2xl px-3.5 py-3 text-left ring-1 transition-colors',
                    entry.isPrimary
                      ? 'bg-blue-50 ring-blue-200'
                      : 'bg-slate-50 ring-slate-100',
                  )}
                >
                  <div
                    className={cn(
                      'mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2',
                      entry.isPrimary
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300',
                    )}
                  >
                    {entry.isPrimary ? (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Основная зарплата
                    </p>
                    <p className="text-xs text-slate-400">
                      По ней строится отчёт к выплате
                    </p>
                  </div>
                </button>

                {entry.isPrimary &&
                entry.isBimonthlySalary &&
                showManualEditors ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {tranches.map((tranche) => {
                      const active =
                        entry.primaryPaymentDay === tranche.paymentDay;
                      return (
                        <button
                          key={tranche.paymentDay}
                          type="button"
                          onClick={() =>
                            update({
                              primaryPaymentDay:
                                tranche.paymentDay as SalaryPaymentDay,
                            })
                          }
                          className={cn(
                            'rounded-xl py-2.5 text-sm font-semibold transition-colors',
                            active
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          Ориентир {tranche.paymentDay}-е
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            {!isIncome && creditAssets.length > 0 && !entry.isOneTime ? (
              linkedCredit && !pickingCredit ? (
                <div className="flex items-center gap-2 rounded-xl bg-[var(--color-expense-soft)] px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-expense)]">
                      Кредит
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {linkedCredit.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickingCredit(true)}
                    className="shrink-0 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
                  >
                    Сменить
                  </button>
                  <button
                    type="button"
                    aria-label="Отвязать кредит"
                    onClick={() => update({ linkedAssetId: undefined })}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : pickingCredit ? (
                <div>
                  <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Платёж по кредиту
                  </Label>
                  <Select
                    value={entry.linkedAssetId ?? 'none'}
                    onValueChange={(value) => {
                      update({
                        linkedAssetId: value === 'none' ? undefined : value,
                      });
                      setPickingCredit(false);
                    }}
                  >
                    <SelectTrigger className="border-0 bg-white shadow-none ring-1 ring-slate-200">
                      <SelectValue placeholder="Выберите кредит" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не привязан</SelectItem>
                      {creditAssets.map((credit) => (
                        <SelectItem key={credit.id} value={String(credit.id)}>
                          {credit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => setPickingCredit(false)}
                    className="mt-2 w-full py-1 text-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickingCredit(true)}
                  className="w-full rounded-xl py-2 text-center text-sm font-medium text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                >
                  Привязать к кредиту
                </button>
              )
            ) : null}

            {canRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </SwipeToDelete>
  );
}

const UNDO_MS = 7000;

export function MoneyFlowStep({
  mode,
  title,
  subtitle,
  initialEntries,
  submitLabel,
  onSubmit,
  onboarding = false,
}: {
  mode: Mode;
  title: string;
  subtitle?: string;
  initialEntries: MoneyFlowEntry[];
  submitLabel: string;
  onSubmit: (entries: MoneyFlowEntry[]) => Promise<void> | void;
  onboarding?: boolean;
}) {
  const [entries, setEntries] = useState<MoneyFlowEntry[]>(
    initialEntries.length
      ? initialEntries
      : [mode === 'income' ? createEmptyIncomeEntry() : createEmptyExpenseEntry()],
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    entries[0]?.id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);
  const [creditAssets, setCreditAssets] = useState<Asset[]>([]);
  const pendingRef = useRef(
    new Map<
      string,
      { entry: MoneyFlowEntry; timer: ReturnType<typeof setTimeout>; index: number }
    >(),
  );
  const submitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== 'expense') return;
    void db.getAllAssets().then((assets) => {
      setCreditAssets(assets.filter((a) => a.provider === 'credit'));
    });
  }, [mode]);

  const canRemove = useMemo(
    () => entries.filter((e) => e.name.trim()).length > 0 || entries.length > 1,
    [entries],
  );

  function scrollToSubmit() {
    window.requestAnimationFrame(() => {
      submitRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  function updateEntry(id: string | undefined, next: MoneyFlowEntry) {
    if (!id) return;
    setEntries((prev) => {
      if (next.isPrimary && mode === 'income') {
        return prev.map((item) =>
          item.id === id ? next : { ...item, isPrimary: false },
        );
      }
      return prev.map((e) => (e.id === id ? next : e));
    });
  }

  function add() {
    const next =
      mode === 'income' ? createEmptyIncomeEntry() : createEmptyExpenseEntry();
    setEntries((prev) => [...prev, next]);
    setExpandedId(next.id ?? null);
  }

  const scheduleRemove = useCallback(
    (id: string | undefined) => {
      if (!id) return;

      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === id);
        const entry = index >= 0 ? prev[index] : undefined;
        if (!entry) return prev;

        const existing = pendingRef.current.get(id);
        if (existing) clearTimeout(existing.timer);

        const timer = setTimeout(() => {
          pendingRef.current.delete(id);
          setToast((current) => (current?.id === id ? null : current));
        }, UNDO_MS);

        pendingRef.current.set(id, { entry, timer, index });
        setToast({
          id,
          name:
            entry.name.trim() ||
            (mode === 'income' ? 'Доход' : 'Расход'),
        });

        const next = prev.filter((e) => e.id !== id);
        return next.length
          ? next
          : [
              mode === 'income'
                ? createEmptyIncomeEntry()
                : createEmptyExpenseEntry(),
            ];
      });
      setExpandedId((current) => (current === id ? null : current));
    },
    [mode],
  );

  const undoRemove = useCallback(() => {
    if (!toast) return;
    const pending = pendingRef.current.get(toast.id);
    if (!pending) {
      setToast(null);
      return;
    }
    clearTimeout(pending.timer);
    pendingRef.current.delete(toast.id);
    setEntries((prev) => {
      const onlyPlaceholder =
        prev.length === 1 &&
        !prev[0]?.name.trim() &&
        !Number(prev[0]?.amount) &&
        !Number(prev[0]?.monthlyAmount);
      const base = onlyPlaceholder ? [] : [...prev];
      const insertAt = Math.min(pending.index, base.length);
      base.splice(insertAt, 0, pending.entry);
      return base;
    });
    setToast(null);
  }, [toast]);

  async function handleSubmit() {
    const filled = entries.filter((e) => e.name.trim());
    if (!filled.length) {
      setError('Добавьте хотя бы одну запись');
      return;
    }
    for (const entry of filled) {
      if (entry.isBimonthlySalary) {
        if (!Number(entry.monthlyAmount ?? entry.amount)) {
          setError(`Укажите оклад для «${entry.name}»`);
          return;
        }
        const tranches = normalizeSalaryTranches(entry.salaryTranches);
        if (!tranches.length) {
          setError(`Укажите график выплат для «${entry.name}»`);
          return;
        }
        const days = tranches.map((t) => t.paymentDay);
        if (new Set(days).size !== days.length) {
          setError(`Дни выплат в «${entry.name}» не должны совпадать`);
          return;
        }
      } else if (!Number(entry.amount)) {
        setError(`Укажите сумму для «${entry.name}»`);
        return;
      }

      if (entry.isOneTime) {
        const date = entry.specificDate?.trim() ?? '';
        if (!date) {
          setError(`Укажите дату для «${entry.name}»`);
          return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          setError(`Дата для «${entry.name}» должна быть в формате ГГГГ-ММ-ДД`);
          return;
        }
      } else if (!entry.isBimonthlySalary) {
        const dayRaw = mode === 'income' ? entry.paymentDay : entry.dueDay;
        if (!isValidMonthDay(dayRaw)) {
          setError(`Укажите день (1–31) для «${entry.name}»`);
          return;
        }
      }
    }
    if (mode === 'income' && !filled.some((e) => e.isPrimary)) {
      setError('Отметьте основную зарплату');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSubmit(
        filled.map((entry) =>
          entry.isBimonthlySalary
            ? {
                ...entry,
                salaryTranches: normalizeSalaryTranches(entry.salaryTranches),
              }
            : entry,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <UndoToast
        visible={toast != null}
        message={toast ? `Удалено «${toast.name}»` : ''}
        durationMs={UNDO_MS}
        onUndo={undoRemove}
        onDismiss={() => setToast(null)}
      />

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-1 pt-1 pb-4">
        <div>
          {onboarding ? (
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="text-sm font-bold tracking-[0.22em] text-blue-600">
                MONESTO
              </p>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 ring-1 ring-blue-100">
                Шаг {mode === 'income' ? '3' : '4'} из 4
              </span>
            </div>
          ) : null}
          <h2 className="text-[1.75rem] font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        <MoneyFlowSummary mode={mode} entries={entries} />

        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {mode === 'income' ? 'Источники' : 'Статьи'}
          </h3>
          <p className="text-[11px] text-slate-400">Свайп влево — удалить</p>
        </div>

        <div>
          {entries.map((entry, index) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              mode={mode}
              index={index}
              expanded={expandedId === entry.id}
              onToggle={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id ?? null)
              }
              onChange={(next) => updateEntry(entry.id, next)}
              onRemove={() => scheduleRemove(entry.id)}
              canRemove={canRemove}
              onPresetApplied={scrollToSubmit}
              creditAssets={creditAssets}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={add}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-300 bg-transparent py-3.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" />
          Добавить {mode === 'income' ? 'доход' : 'расход'}
        </button>
      </div>

      <div
        ref={submitRef}
        className="shrink-0 space-y-2 border-t border-slate-100 bg-[#f8fafc] pt-3 pb-[max(16px,env(safe-area-inset-bottom))]"
      >
        {error ? (
          <p className="text-center text-sm text-red-500">{error}</p>
        ) : null}
        <Button
          type="button"
          variant={onboarding ? 'navy' : 'default'}
          size="lg"
          className="w-full"
          disabled={saving}
          onClick={handleSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
