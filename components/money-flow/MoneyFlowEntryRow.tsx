import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { MoneyFlowEntry } from '@/lib/types';

interface Props {
  entry: MoneyFlowEntry;
  mode: 'income' | 'expense';
  index: number;
  onChange: (entry: MoneyFlowEntry) => void;
  onRemove: () => void;
  showOneTimeToggle?: boolean;
  showPrimarySalary?: boolean;
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</Text>;
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-2 ${active ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MoneyFlowEntryRow({
  entry,
  mode,
  index,
  onChange,
  onRemove,
  showOneTimeToggle,
  showPrimarySalary,
}: Props) {
  const update = (patch: Partial<MoneyFlowEntry>) => onChange({ ...entry, ...patch });
  const accent = mode === 'income' ? 'text-emerald-600' : 'text-slate-700';
  const accentBg = mode === 'income' ? 'bg-emerald-50' : 'bg-slate-100';

  return (
    <View className="mb-3 overflow-hidden rounded-3xl border border-slate-100 bg-white">
      <View className="flex-row items-center justify-between border-b border-slate-50 px-4 py-3">
        <View className={`rounded-full px-2.5 py-1 ${accentBg}`}>
          <Text className={`text-xs font-bold ${accent}`}>
            {mode === 'income' ? `Доход ${index + 1}` : `Расход ${index + 1}`}
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full bg-slate-50">
          <Ionicons name="trash-outline" size={16} color="#94a3b8" />
        </Pressable>
      </View>

      <View className="px-4 py-4">
        <FieldLabel>Название</FieldLabel>
        <TextInput
          className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3.5 text-base text-slate-900"
          placeholder={mode === 'income' ? 'Зарплата, фриланс…' : 'Аренда, подписки…'}
          placeholderTextColor="#94a3b8"
          value={entry.name}
          onChangeText={(name) => update({ name })}
        />

        {mode === 'income' && showOneTimeToggle ? (
          <View className="mb-4">
            <FieldLabel>Тип</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              <Chip
                label="Регулярный"
                active={!entry.isOneTime}
                onPress={() => update({ isOneTime: false })}
              />
              <Chip
                label="Единоразовый"
                active={Boolean(entry.isOneTime)}
                onPress={() => update({ isOneTime: true, isBimonthlySalary: false })}
              />
            </View>
          </View>
        ) : null}

        {mode === 'income' && !entry.isOneTime ? (
          <View className="mb-4">
            <FieldLabel>График</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              <Chip
                label="Раз в месяц"
                active={!entry.isBimonthlySalary}
                onPress={() => update({ isBimonthlySalary: false })}
              />
              <Chip
                label="10 и 25 число"
                active={Boolean(entry.isBimonthlySalary)}
                onPress={() => update({ isBimonthlySalary: true, isOneTime: false })}
              />
            </View>
          </View>
        ) : null}

        <FieldLabel>
          {entry.isBimonthlySalary && mode === 'income' ? 'Месячная сумма' : 'Сумма'}
        </FieldLabel>
        {entry.isBimonthlySalary && mode === 'income' ? (
          <TextInput
            className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3.5 text-base text-slate-900"
            placeholder="0 ₽"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={entry.monthlyAmount ?? entry.amount}
            onChangeText={(monthlyAmount) => update({ monthlyAmount, amount: monthlyAmount })}
          />
        ) : (
          <TextInput
            className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3.5 text-base text-slate-900"
            placeholder="0 ₽"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={entry.amount}
            onChangeText={(amount) => update({ amount })}
          />
        )}

        {!entry.isOneTime && !entry.isBimonthlySalary ? (
          <>
            <FieldLabel>{mode === 'income' ? 'День выплаты' : 'День списания'}</FieldLabel>
            <TextInput
              className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3.5 text-base text-slate-900"
              placeholder="1–31"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={mode === 'income' ? entry.paymentDay : entry.dueDay}
              onChangeText={(value) =>
                update(mode === 'income' ? { paymentDay: value } : { dueDay: value })
              }
            />
          </>
        ) : null}

        {entry.isOneTime ? (
          <>
            <FieldLabel>Дата</FieldLabel>
            <TextInput
              className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3.5 text-base text-slate-900"
              placeholder="ГГГГ-ММ-ДД"
              placeholderTextColor="#94a3b8"
              value={entry.specificDate ?? ''}
              onChangeText={(specificDate) => update({ specificDate })}
            />
          </>
        ) : null}

        {mode === 'income' && showPrimarySalary ? (
          <View>
            <FieldLabel>Основная зарплата</FieldLabel>
            <View className="mb-2 flex-row flex-wrap gap-2">
              <Chip
                label={entry.isPrimary ? 'Да, основная' : 'Сделать основной'}
                active={Boolean(entry.isPrimary)}
                onPress={() => update({ isPrimary: !entry.isPrimary })}
              />
            </View>
            {entry.isPrimary && entry.isBimonthlySalary ? (
              <View className="mt-1 flex-row gap-2">
                {[10, 25].map((day) => (
                  <Pressable
                    key={day}
                    className={`flex-1 rounded-2xl px-3 py-3 ${
                      entry.primaryPaymentDay === day ? 'bg-blue-600' : 'bg-slate-50'
                    }`}
                    onPress={() => update({ primaryPaymentDay: day as 10 | 25 })}>
                    <Text
                      className={`text-center text-sm font-semibold ${
                        entry.primaryPaymentDay === day ? 'text-white' : 'text-slate-700'
                      }`}>
                      Ориентир {day}-е
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
