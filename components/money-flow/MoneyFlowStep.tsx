import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoneyFlowEntryRow } from "@/components/money-flow/MoneyFlowEntryRow";
import { MoneyFlowSummary } from "@/components/money-flow/MoneyFlowSummary";
import { FormScrollView } from "@/components/ui/FormScrollView";
import type { MoneyFlowEntry } from "@/lib/types";
import {
  createEmptyExpenseEntry,
  createEmptyIncomeEntry,
} from "@/lib/utils/format";

const LIST_LAYOUT = LinearTransition.duration(280).easing(
  Easing.out(Easing.cubic),
);

interface Props {
  mode: "income" | "expense";
  title: string;
  subtitle: string;
  initialEntries?: MoneyFlowEntry[];
  onSave: (entries: MoneyFlowEntry[]) => Promise<void>;
  onNext?: () => void;
  submitLabel?: string;
  showOneTimeToggle?: boolean;
  showPrimarySalary?: boolean;
}

function validateEntries(
  mode: "income" | "expense",
  entries: MoneyFlowEntry[],
): string | null {
  const filled = entries.filter((entry) => entry.name.trim());
  if (filled.length === 0) return "Добавьте хотя бы одну запись";

  for (const entry of filled) {
    if (entry.isBimonthlySalary) {
      if (!Number(entry.monthlyAmount ?? entry.amount)) {
        return `Укажите сумму для «${entry.name}»`;
      }
    } else if (!Number(entry.amount)) {
      return `Укажите сумму для «${entry.name}»`;
    }
  }

  if (mode === "income") {
    const hasPrimary = filled.some((entry) => entry.isPrimary);
    if (!hasPrimary) return "Отметьте основную зарплату";
  }

  return null;
}

function entryKey(entry: MoneyFlowEntry, index: number): string {
  return entry.id ?? `row-${index}`;
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
  const insets = useSafeAreaInsets();
  const seed = initialEntries?.length
    ? initialEntries
    : [
        mode === "income"
          ? createEmptyIncomeEntry()
          : createEmptyExpenseEntry(),
      ];
  const [entries, setEntries] = useState<MoneyFlowEntry[]>(seed);
  const [saving, setSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string>(() =>
    entryKey(seed[0], 0),
  );
  const animatedKeysRef = useRef(new Set<string>());
  const footerPad = Math.max(insets.bottom, 12);

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
      if (entry.isPrimary && showPrimarySalary) {
        return prev.map((item, idx) => ({
          ...item,
          ...(idx === index ? entry : { isPrimary: false }),
        }));
      }
      const next = [...prev];
      next[index] = entry;
      return next;
    });
  };

  const addEntry = () => {
    const next =
      mode === "income" ? createEmptyIncomeEntry() : createEmptyExpenseEntry();
    const key = entryKey(next, entries.length);
    animatedKeysRef.current.add(key);
    setEntries((prev) => [...prev, next]);
    setExpandedKey(key);
  };

  const removeEntry = (index: number) => {
    const removed = entries[index];
    const removedKey = entryKey(removed, index);
    const remaining = entries.filter((_, idx) => idx !== index);

    if (remaining.length === 0) {
      const empty =
        mode === "income"
          ? createEmptyIncomeEntry()
          : createEmptyExpenseEntry();
      const emptyKey = entryKey(empty, 0);
      animatedKeysRef.current.add(emptyKey);
      setEntries([empty]);
      setExpandedKey(emptyKey);
      return;
    }

    setEntries(remaining);
    if (expandedKey === removedKey) {
      const focus = Math.min(index, remaining.length - 1);
      setExpandedKey(entryKey(remaining[focus], focus));
    }
  };

  const handleSubmit = async () => {
    const error = validateEntries(mode, normalizedEntries);
    if (error) {
      Alert.alert("Проверьте данные", error);
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
    <View className="flex-1 bg-white">
      <FormScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 100 + footerPad,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-slate-900">{title}</Text>
        <Text className="mb-5 mt-1.5 text-sm leading-5 text-slate-500">
          {subtitle}
        </Text>

        <MoneyFlowSummary mode={mode} entries={normalizedEntries} />

        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-900">
            {mode === "income" ? "Источники" : "Платежи"}
          </Text>
          <Text className="text-xs text-slate-400">
            Свайп влево — удалить
          </Text>
        </View>

        {normalizedEntries.map((entry, index) => {
          const key = entryKey(entry, index);
          return (
            <MoneyFlowEntryRow
              key={key}
              index={index}
              entry={entry}
              mode={mode}
              expanded={expandedKey === key}
              animateEnter={animatedKeysRef.current.has(key)}
              onToggle={() =>
                setExpandedKey((prev) => (prev === key ? "" : key))
              }
              onChange={(next) => updateEntry(index, next)}
              onRemove={() => removeEntry(index)}
              canRemove={
                normalizedEntries.length > 1 || Boolean(entry.name.trim())
              }
              showOneTimeToggle={showOneTimeToggle}
              showPrimarySalary={showPrimarySalary}
            />
          );
        })}

        <Animated.View layout={LIST_LAYOUT} entering={FadeIn.duration(200)}>
          <Pressable
            className="mb-2 flex-row items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3.5"
            onPress={addEntry}
          >
            <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="add" size={18} color="#2563EB" />
            </View>
            <Text className="text-sm font-semibold text-blue-600">
              {mode === "income" ? "Добавить доход" : "Добавить расход"}
            </Text>
          </Pressable>
        </Animated.View>
      </FormScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3"
        style={{ paddingBottom: footerPad }}
      >
        <Pressable
          className={`rounded-2xl px-4 py-4 ${saving ? "bg-blue-300" : "bg-blue-600"}`}
          disabled={saving}
          onPress={handleSubmit}
          testID="money-flow-submit"
        >
          <Text className="text-center text-base font-semibold text-white">
            {submitLabel ?? (onNext ? "Далее" : "Сохранить")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
