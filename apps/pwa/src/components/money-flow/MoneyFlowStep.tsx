import {
  Badge,
  Button,
  Input,
  Label,
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
} from 'lucide-react';
import { useMemo, useRef, useState, useCallback } from 'react';

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
import type { MoneyFlowEntry, SalaryPaymentDay, SalaryTranche } from '@/lib/types';
import {
  createEmptyExpenseEntry,
  createEmptyIncomeEntry,
  formatRub,
} from '@/lib/utils/format';

type Mode = 'income' | 'expense';

const SCHEDULE_PRESETS: {
  id: Exclude<SalarySchedulePresetId, 'custom'>;
  title: string;
  badge: string;
  lines: string[];
}[] = [
  {
    id: '10-25',
    title: '10 и 25',
    badge: 'Классика',
    lines: ['10-е ← 16…конец прошл.', '25-е ← 1…15 тек.'],
  },
  {
    id: '5-20',
    title: '5 и 20',
    badge: 'Альтернатива',
    lines: ['5-е ← 16…конец прошл.', '20-е ← 1…15 тек.'],
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
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Быстрый выбор
      </Label>
      <div className="grid grid-cols-2 gap-2.5">
        {SCHEDULE_PRESETS.map((preset) => {
          const active = activeId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200',
                active
                  ? 'border-blue-500 bg-blue-50 shadow-[0_8px_24px_rgb(37_99_235/0.16)] ring-1 ring-blue-500'
                  : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50',
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p
                  className={cn(
                    'text-base font-bold',
                    active ? 'text-blue-700' : 'text-slate-900',
                  )}
                >
                  {preset.title}
                </p>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {preset.badge}
                </span>
              </div>
              <div className="space-y-1">
                {preset.lines.map((line) => (
                  <p
                    key={line}
                    className={cn(
                      'text-[11px] leading-4',
                      active ? 'text-blue-700/80' : 'text-slate-400',
                    )}
                  >
                    {line}
                  </p>
                ))}
              </div>
              {active ? (
                <span className="absolute bottom-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
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
        ? '10 и 25'
        : preset === '5-20'
          ? '5 и 20'
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
      hint = `Зарплата: ${parts.join(', ')}`;
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-slate-900 px-5 py-5">
      <div className="flex items-end justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {mode === 'income' ? 'За месяц' : 'Расходы за месяц'}
          </p>
          <p className="mt-1 text-3xl font-bold text-white">
            {formatRub(monthlyTotal)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800 px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Записей
          </p>
          <p className="text-lg font-bold text-white">{filled.length}</p>
        </div>
      </div>
      {oneTimeTotal > 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          + разовые: {formatRub(oneTimeTotal)}
        </p>
      ) : null}
      {hint ? (
        <p className="mt-2 text-xs leading-4 text-slate-400">{hint}</p>
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
          inputMode="numeric"
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
            inputMode="numeric"
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
            inputMode="numeric"
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
}) {
  const update = (patch: Partial<MoneyFlowEntry>) =>
    onChange({ ...entry, ...patch });
  const isIncome = mode === 'income';
  const accent = isIncome ? '#059669' : '#475569';
  const accentBg = isIncome ? '#ECFDF5' : '#F1F5F9';
  const title =
    entry.name.trim() ||
    (isIncome ? `Доход ${index + 1}` : `Расход ${index + 1}`);

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
  const activePreset: SalarySchedulePresetId = manualOverride
    ? 'custom'
    : detectedPreset;
  const showManualEditors = activePreset === 'custom';

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
    setManualOverride(false);
    update({
      isBimonthlySalary: true,
      isOneTime: false,
      salaryTranches: next,
      primaryPaymentDay: next[next.length - 1]?.paymentDay ?? 25,
    });
    window.setTimeout(() => onPresetApplied?.(), 80);
  };

  return (
    <SwipeToDelete
      enabled={canRemove && !expanded}
      onDelete={onRemove}
      borderRadius={16}
      className="mb-3"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: accentBg }}
        >
          {isIncome ? (
            <ArrowDown className="h-[18px] w-[18px]" style={{ color: accent }} />
          ) : (
            <ArrowUp className="h-[18px] w-[18px]" style={{ color: accent }} />
          )}
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center">
            <p className="mr-2 min-w-0 flex-1 truncate text-base font-semibold text-slate-900">
              {title}
            </p>
            {entry.isPrimary ? (
              <Badge variant="soft" className="shrink-0 text-[10px]">
                ОСН.
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {previewLine(entry, mode)}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="ml-2 h-[18px] w-[18px] text-slate-400" />
        ) : (
          <ChevronDown className="ml-2 h-[18px] w-[18px] text-slate-400" />
        )}
      </button>

      {expanded ? (
        <div className="animate-in fade-in-0 slide-in-from-top-1 border-t border-slate-100 px-4 pb-4 pt-3 duration-200">
          <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Название
          </Label>
          <Input
            className="mb-4 border-slate-100 bg-slate-50"
            value={entry.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder={isIncome ? 'Зарплата, фриланс…' : 'Аренда, подписки…'}
          />

          {isIncome ? (
            <div className="mb-4">
              <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Тип
              </Label>
              <SlidingToggleGroup
                size="sm"
                value={entry.isOneTime ? 'one_time' : 'recurring'}
                onValueChange={(key) =>
                  update({
                    isOneTime: key === 'one_time',
                    isBimonthlySalary:
                      key === 'one_time' ? false : entry.isBimonthlySalary,
                  })
                }
                options={[
                  { value: 'recurring', label: 'Регулярный' },
                  { value: 'one_time', label: 'Разовый' },
                ]}
              />
            </div>
          ) : null}

          {isIncome && !entry.isOneTime ? (
            <div className="mb-4">
              <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                График
              </Label>
              <SlidingToggleGroup
                size="sm"
                value={scheduleKey === 'periods' ? 'periods' : 'monthly'}
                onValueChange={(key) =>
                  update({
                    isBimonthlySalary: key === 'periods',
                    isOneTime: false,
                    salaryTranches:
                      key === 'periods'
                        ? entry.salaryTranches?.length
                          ? entry.salaryTranches
                          : createEmptyBimonthlyTranches()
                        : entry.salaryTranches,
                  })
                }
                options={[
                  { value: 'monthly', label: 'Фикс. день' },
                  { value: 'periods', label: 'По периодам' },
                ]}
              />
              <p className="mt-2 text-[11px] leading-4 text-slate-400">
                {scheduleKey === 'periods'
                  ? 'Выберите пресет или настройте даты вручную.'
                  : 'Одна фиксированная сумма в выбранный день месяца.'}
              </p>
            </div>
          ) : null}

          <div className="mb-4 flex gap-3">
            <div className="min-w-0 flex-[1.4]">
              <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {entry.isBimonthlySalary && isIncome
                  ? 'Оклад на руки / мес'
                  : 'Сумма'}
              </Label>
              <div className="flex items-center rounded-xl border border-slate-100 bg-slate-50">
                <Input
                  className="border-0 bg-transparent focus-visible:ring-0"
                  inputMode="decimal"
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
                <span className="pr-3.5 text-sm font-semibold text-slate-400">
                  ₽
                </span>
              </div>
            </div>

            {!entry.isOneTime && !entry.isBimonthlySalary ? (
              <div className="flex-1">
                <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  День
                </Label>
                <Input
                  className="border-slate-100 bg-slate-50 text-center"
                  inputMode="numeric"
                  value={isIncome ? entry.paymentDay ?? '' : entry.dueDay ?? ''}
                  onChange={(e) =>
                    update(
                      isIncome
                        ? { paymentDay: e.target.value }
                        : { dueDay: e.target.value },
                    )
                  }
                  placeholder="1–31"
                />
              </div>
            ) : null}

            {entry.isOneTime ? (
              <div className="flex-[1.2]">
                <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Дата
                </Label>
                <Input
                  className="border-slate-100 bg-slate-50 text-center text-sm"
                  value={entry.specificDate ?? ''}
                  onChange={(e) => update({ specificDate: e.target.value })}
                  placeholder="ГГГГ-ММ-ДД"
                />
              </div>
            ) : null}
          </div>

          {isIncome && entry.isBimonthlySalary ? (
            <div className="mb-4 space-y-3">
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
                <p className="rounded-2xl bg-blue-50/70 px-3.5 py-3 text-[12px] leading-4 text-blue-700/80">
                  Пресет применён. Нажмите на него ещё раз, чтобы настроить
                  выплаты вручную.
                </p>
              )}
            </div>
          ) : null}

          {isIncome ? (
            <div className="mb-1">
              <button
                type="button"
                onClick={() => update({ isPrimary: !entry.isPrimary })}
                className={
                  entry.isPrimary
                    ? 'flex w-full items-center rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-left transition-colors'
                    : 'flex w-full items-center rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-left transition-colors'
                }
              >
                <div
                  className={
                    entry.isPrimary
                      ? 'mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-600'
                      : 'mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300'
                  }
                >
                  {entry.isPrimary ? (
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Основная зарплата
                  </p>
                  <p className="text-xs text-slate-500">
                    По ней строится отчёт к выплате
                  </p>
                </div>
              </button>

              {entry.isPrimary && entry.isBimonthlySalary ? (
                <div className="mt-3 flex flex-wrap gap-2">
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
                        className={
                          active
                            ? 'flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors'
                            : 'flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition-colors'
                        }
                      >
                        Ориентир {tranche.paymentDay}-е
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mb-4">
              <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Тип
              </Label>
              <SlidingToggleGroup
                size="sm"
                value={entry.isOneTime ? 'one_time' : 'recurring'}
                onValueChange={(key) =>
                  update({ isOneTime: key === 'one_time' })
                }
                options={[
                  { value: 'recurring', label: 'Ежемесячный' },
                  { value: 'one_time', label: 'Разовый' },
                ]}
              />
            </div>
          )}

          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </button>
          ) : null}
        </div>
      ) : null}
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
}: {
  mode: Mode;
  title: string;
  subtitle?: string;
  initialEntries: MoneyFlowEntry[];
  submitLabel: string;
  onSubmit: (entries: MoneyFlowEntry[]) => Promise<void> | void;
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
  const pendingRef = useRef(
    new Map<
      string,
      { entry: MoneyFlowEntry; timer: ReturnType<typeof setTimeout>; index: number }
    >(),
  );
  const submitRef = useRef<HTMLDivElement>(null);

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

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1.5 text-[15px] text-slate-400">{subtitle}</p>
          ) : null}
        </div>

        <MoneyFlowSummary mode={mode} entries={entries} />

        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">
            {mode === 'income' ? 'Источники' : 'Статьи'}
          </h3>
          <p className="text-xs text-slate-400">Свайп влево — удалить</p>
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
