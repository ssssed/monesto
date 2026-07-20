import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { MoneyFlowEntryRow } from '@/components/money-flow/MoneyFlowEntryRow';
import { MoneyFlowSummary } from '@/components/money-flow/MoneyFlowSummary';
import type { MoneyFlowEntry } from '@/lib/types';
import { createEmptyExpenseEntry, createEmptyIncomeEntry } from '@/lib/utils/format';

interface Props {
  mode: 'income' | 'expense';
  title: string;
  subtitle: string;
  initialEntries?: MoneyFlowEntry[];
  onSave: (entries: MoneyFlowEntry[]) => Promise<void>;
  onNext?: () => void;
  submitLabel?: string;
  showOneTimeToggle?: boolean;
  showPrimarySalary?: boolean;
}

function validateEntries(mode: 'income' | 'expense', entries: MoneyFlowEntry[]): string | null {
  const filled = entries.filter((entry) => entry.name.trim());
  if (filled.length === 0) return 'Добавьте хотя бы одну запись';

  for (const entry of filled) {
    if (entry.isBimonthlySalary) {
      if (!Number(entry.monthlyAmount ?? entry.amount)) return `Укажите сумму для «${entry.name}»`;
    } else if (!Number(entry.amount)) {
      return `Укажите сумму для «${entry.name}»`;
    }
  }

  if (mode === 'income') {
    const hasPrimary = filled.some((entry) => entry.isPrimary);
    if (!hasPrimary) return 'Отметьте основную зарплату';
  }

  return null;
}

export function MoneyFlowStep({
  mode,
  title,
  subtitle,
  initialEntries,
  onSave,
  onNext,
  submitLabel,
  showOneTimeToggle,
  showPrimarySalary,
}: Props) {
  const [entries, setEntries] = useState<MoneyFlowEntry[]>(
    initialEntries?.length
      ? initialEntries
      : [mode === 'income' ? createEmptyIncomeEntry() : createEmptyExpenseEntry()],
  );
  const [saving, setSaving] = useState(false);

  const normalizedEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        isPrimary: showPrimarySalary ? entry.isPrimary : false,
      })),
    [entries, showPrimarySalary],
  );

  const updateEntry = (index: number, entry: MoneyFlowEntry) => {
    setEntries((prev) => {
      const next = [...prev];
      if (entry.isPrimary && showPrimarySalary) {
        return next.map((item, idx) => ({
          ...item,
          ...(idx === index ? entry : { isPrimary: false }),
        }));
      }
      next[index] = entry;
      return next;
    });
  };

  const handleSubmit = async () => {
    const error = validateEntries(mode, normalizedEntries);
    if (error) {
      Alert.alert('Проверьте данные', error);
      return;
    }

    setSaving(true);
    try {
      const payload = normalizedEntries.filter((entry) => entry.name.trim());
      await onSave(payload);
      onNext?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Text className="text-3xl font-bold text-slate-900">{title}</Text>
      <Text className="mb-5 mt-1.5 text-sm leading-5 text-slate-500">{subtitle}</Text>

      <MoneyFlowSummary mode={mode} entries={normalizedEntries} />

      {normalizedEntries.map((entry, index) => (
        <MoneyFlowEntryRow
          key={entry.id ?? index}
          index={index}
          entry={entry}
          mode={mode}
          onChange={(next) => updateEntry(index, next)}
          onRemove={() => setEntries((prev) => prev.filter((_, idx) => idx !== index))}
          showOneTimeToggle={showOneTimeToggle}
          showPrimarySalary={showPrimarySalary}
        />
      ))}

      <Pressable
        className="mb-4 flex-row items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4"
        onPress={() =>
          setEntries((prev) => [
            ...prev,
            mode === 'income' ? createEmptyIncomeEntry() : createEmptyExpenseEntry(),
          ])
        }>
        <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
        <Text className="ml-2 text-sm font-semibold text-blue-600">
          {mode === 'income' ? 'Добавить доход' : 'Добавить расход'}
        </Text>
      </Pressable>

      <Pressable
        className={`rounded-2xl px-4 py-4 ${saving ? 'bg-blue-300' : 'bg-blue-600'}`}
        disabled={saving}
        onPress={handleSubmit}
        testID="money-flow-submit">
        <Text className="text-center text-base font-semibold text-white">
          {submitLabel ?? (onNext ? 'Далее' : 'Сохранить')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
