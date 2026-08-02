import {
  Badge,
  Button,
  Input,
  Label,
  SlidingToggleGroup,
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
import { useMemo, useState } from 'react';

import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { calculateSalaryPaymentAmount } from '@/lib/report/calculateSalaryPayment';
import type { MoneyFlowEntry, SalaryPaymentDay } from '@/lib/types';
import {
  createEmptyExpenseEntry,
  createEmptyIncomeEntry,
  formatRub,
} from '@/lib/utils/format';

type Mode = 'income' | 'expense';

function previewLine(entry: MoneyFlowEntry, mode: Mode): string {
  if (entry.isBimonthlySalary) {
    const monthly = Number(entry.monthlyAmount ?? entry.amount ?? 0);
    return monthly ? `${formatRub(monthly)} / мес · 10 и 25` : '10 и 25 число';
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
  const bimonthly = entries.find(
    (entry) => entry.isBimonthlySalary && entry.name.trim(),
  );
  if (bimonthly) {
    const monthly = Number(bimonthly.monthlyAmount ?? bimonthly.amount);
    if (monthly) {
      const now = new Date();
      const pay25 = calculateSalaryPaymentAmount(
        monthly,
        25,
        new Date(now.getFullYear(), now.getMonth(), 25),
      );
      const pay10 = calculateSalaryPaymentAmount(
        monthly,
        10,
        new Date(now.getFullYear(), now.getMonth(), 10),
      );
      hint = `Зарплата: 10-е ≈ ${formatRub(pay10.amount)}, 25-е ≈ ${formatRub(pay25.amount)}`;
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

function EntryRow({
  entry,
  mode,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
  canRemove,
}: {
  entry: MoneyFlowEntry;
  mode: Mode;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (entry: MoneyFlowEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
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
      ? 'bimonthly'
      : 'monthly';

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
                value={scheduleKey === 'bimonthly' ? 'bimonthly' : 'monthly'}
                onValueChange={(key) =>
                  update({
                    isBimonthlySalary: key === 'bimonthly',
                    isOneTime: false,
                  })
                }
                options={[
                  { value: 'monthly', label: 'Раз в месяц' },
                  { value: 'bimonthly', label: '10 и 25' },
                ]}
              />
            </div>
          ) : null}

          <div className="mb-4 flex gap-3">
            <div className="min-w-0 flex-[1.4]">
              <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {entry.isBimonthlySalary && isIncome ? 'Сумма / мес' : 'Сумма'}
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
                <div className="mt-3 flex gap-2">
                  {([10, 25] as const).map((day) => {
                    const active = entry.primaryPaymentDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          update({
                            primaryPaymentDay: day as SalaryPaymentDay,
                          })
                        }
                        className={
                          active
                            ? 'flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors'
                            : 'flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition-colors'
                        }
                      >
                        Ориентир {day}-е
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

  const canRemove = useMemo(
    () => entries.filter((e) => e.name.trim()).length > 0 || entries.length > 1,
    [entries],
  );

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

  function remove(id: string | undefined) {
    if (!id) return;
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      return next.length
        ? next
        : [mode === 'income' ? createEmptyIncomeEntry() : createEmptyExpenseEntry()];
    });
  }

  async function handleSubmit() {
    const filled = entries.filter((e) => e.name.trim());
    if (!filled.length) {
      setError('Добавьте хотя бы одну запись');
      return;
    }
    for (const entry of filled) {
      if (entry.isBimonthlySalary) {
        if (!Number(entry.monthlyAmount ?? entry.amount)) {
          setError(`Укажите сумму для «${entry.name}»`);
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
      await onSubmit(filled);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1.5 text-[15px] text-slate-400">{subtitle}</p>
        ) : null}
      </div>

      <MoneyFlowSummary mode={mode} entries={entries} />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Источники</h3>
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
            onRemove={() => remove(entry.id)}
            canRemove={canRemove}
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
  );
}
