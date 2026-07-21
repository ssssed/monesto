import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import { FormTextInput } from "@/components/ui/FormScrollView";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import type { MoneyFlowEntry } from "@/lib/types";
import { formatRub } from "@/lib/utils/format";

interface Props {
  entry: MoneyFlowEntry;
  mode: "income" | "expense";
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (entry: MoneyFlowEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
  showOneTimeToggle?: boolean;
  showPrimarySalary?: boolean;
  animateEnter?: boolean;
}

const EASE_OUT = Easing.out(Easing.cubic);
/** Только layout — без FadeInDown на теле, иначе анимация дёргается. */
const LAYOUT = LinearTransition.duration(280).easing(EASE_OUT);
const ENTER = FadeInDown.duration(340).easing(EASE_OUT);
const EXIT = FadeOut.duration(200).easing(Easing.in(Easing.cubic));

function Segment({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View className="flex-row rounded-2xl bg-slate-100 p-1">
      {options.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`flex-1 rounded-xl py-2.5 ${active ? "bg-white" : ""}`}
            style={
              active
                ? {
                    shadowColor: "#0f172a",
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }
                : undefined
            }
          >
            <Text
              className={`text-center text-xs font-semibold ${
                active ? "text-slate-900" : "text-slate-500"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function previewLine(
  entry: MoneyFlowEntry,
  mode: "income" | "expense",
): string {
  if (entry.isBimonthlySalary) {
    const monthly = Number(entry.monthlyAmount ?? entry.amount ?? 0);
    return monthly ? `${formatRub(monthly)} / мес · 10 и 25` : "10 и 25 число";
  }
  if (entry.isOneTime) {
    const amount = Number(entry.amount || 0);
    const date = entry.specificDate || "дата не указана";
    return amount ? `${formatRub(amount)} · ${date}` : date;
  }
  const amount = Number(entry.amount || 0);
  const day = mode === "income" ? entry.paymentDay : entry.dueDay;
  const dayLabel = day ? `${day}-е` : "день?";
  return amount ? `${formatRub(amount)} · ${dayLabel}` : dayLabel;
}

export function MoneyFlowEntryRow({
  entry,
  mode,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
  canRemove,
  showOneTimeToggle,
  showPrimarySalary,
  animateEnter = true,
}: Props) {
  const update = (patch: Partial<MoneyFlowEntry>) =>
    onChange({ ...entry, ...patch });
  const isIncome = mode === "income";
  const accent = isIncome ? "#059669" : "#475569";
  const accentBg = isIncome ? "#ECFDF5" : "#F1F5F9";
  const title =
    entry.name.trim() ||
    (isIncome ? `Доход ${index + 1}` : `Расход ${index + 1}`);

  const scheduleKey = entry.isOneTime
    ? "one_time"
    : entry.isBimonthlySalary
      ? "bimonthly"
      : "monthly";

  return (
    <Animated.View
      entering={animateEnter ? ENTER : undefined}
      exiting={EXIT}
      layout={LAYOUT}
      style={{ marginBottom: 12 }}
    >
      <SwipeToDelete
        enabled={canRemove}
        onDelete={onRemove}
        borderRadius={24}
        borderColor={expanded ? "#e2e8f0" : "#f1f5f9"}
      >
        <Pressable
          onPress={onToggle}
          className="flex-row items-center px-4 py-3.5 active:bg-slate-50"
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: accentBg }}
          >
            <Ionicons
              name={isIncome ? "arrow-down-outline" : "arrow-up-outline"}
              size={18}
              color={accent}
            />
          </View>

          <View className="ml-3 min-w-0 flex-1">
            <View className="flex-row items-center">
              <Text
                className="mr-2 flex-1 text-base font-semibold text-slate-900"
                numberOfLines={1}
              >
                {title}
              </Text>
              {entry.isPrimary ? (
                <View className="rounded-full bg-blue-50 px-2 py-0.5">
                  <Text className="text-[10px] font-bold uppercase text-blue-600">
                    осн.
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-0.5 text-sm text-slate-500" numberOfLines={1}>
              {previewLine(entry, mode)}
            </Text>
          </View>

          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#94A3B8"
            style={{ marginLeft: 8 }}
          />
        </Pressable>

        {expanded ? (
          <View className="border-t border-slate-100 px-4 pb-4 pt-3">
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Название
            </Text>
            <FormTextInput
              className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3.5 text-base text-slate-900"
              placeholder={
                isIncome ? "Зарплата, фриланс…" : "Аренда, подписки…"
              }
              placeholderTextColor="#94a3b8"
              value={entry.name}
              onChangeText={(name) => update({ name })}
            />

            {isIncome && showOneTimeToggle ? (
              <View className="mb-4">
                <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Тип
                </Text>
                <Segment
                  value={entry.isOneTime ? "one_time" : "recurring"}
                  onChange={(key) =>
                    update({
                      isOneTime: key === "one_time",
                      isBimonthlySalary:
                        key === "one_time" ? false : entry.isBimonthlySalary,
                    })
                  }
                  options={[
                    { key: "recurring", label: "Регулярный" },
                    { key: "one_time", label: "Разовый" },
                  ]}
                />
              </View>
            ) : null}

            {isIncome && !entry.isOneTime ? (
              <View className="mb-4">
                <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  График
                </Text>
                <Segment
                  value={scheduleKey === "bimonthly" ? "bimonthly" : "monthly"}
                  onChange={(key) =>
                    update({
                      isBimonthlySalary: key === "bimonthly",
                      isOneTime: false,
                    })
                  }
                  options={[
                    { key: "monthly", label: "Раз в месяц" },
                    { key: "bimonthly", label: "10 и 25" },
                  ]}
                />
              </View>
            ) : null}

            <View className="mb-4 flex-row gap-3">
              <View className="flex-[1.4]">
                <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {entry.isBimonthlySalary && isIncome
                    ? "Сумма / мес"
                    : "Сумма"}
                </Text>
                <View className="flex-row items-center rounded-2xl border border-slate-100 bg-slate-50">
                  <FormTextInput
                    className="flex-1 px-3.5 py-3.5 text-base text-slate-900"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={
                      entry.isBimonthlySalary && isIncome
                        ? (entry.monthlyAmount ?? entry.amount)
                        : entry.amount
                    }
                    onChangeText={(value) =>
                      entry.isBimonthlySalary && isIncome
                        ? update({ monthlyAmount: value, amount: value })
                        : update({ amount: value })
                    }
                  />
                  <Text className="pr-3.5 text-sm font-semibold text-slate-400">
                    ₽
                  </Text>
                </View>
              </View>

              {!entry.isOneTime && !entry.isBimonthlySalary ? (
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    День
                  </Text>
                  <FormTextInput
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3.5 text-center text-base text-slate-900"
                    placeholder="1–31"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={isIncome ? entry.paymentDay : entry.dueDay}
                    onChangeText={(value) =>
                      update(
                        isIncome ? { paymentDay: value } : { dueDay: value },
                      )
                    }
                  />
                </View>
              ) : null}

              {entry.isOneTime ? (
                <View className="flex-[1.2]">
                  <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Дата
                  </Text>
                  <FormTextInput
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3.5 text-center text-sm text-slate-900"
                    placeholder="ГГГГ-ММ-ДД"
                    placeholderTextColor="#94a3b8"
                    value={entry.specificDate ?? ""}
                    onChangeText={(specificDate) => update({ specificDate })}
                  />
                </View>
              ) : null}
            </View>

            {isIncome && showPrimarySalary ? (
              <View className="mb-1">
                <Pressable
                  onPress={() => update({ isPrimary: !entry.isPrimary })}
                  className={`flex-row items-center rounded-2xl border px-3.5 py-3 ${
                    entry.isPrimary
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <View
                    className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
                      entry.isPrimary
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {entry.isPrimary ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-900">
                      Основная зарплата
                    </Text>
                    <Text className="text-xs text-slate-500">
                      По ней строится отчёт к выплате
                    </Text>
                  </View>
                </Pressable>

                {entry.isPrimary && entry.isBimonthlySalary ? (
                  <View className="mt-3 flex-row gap-2">
                    {([10, 25] as const).map((day) => {
                      const active = entry.primaryPaymentDay === day;
                      return (
                        <Pressable
                          key={day}
                          className={`flex-1 rounded-2xl py-3 ${
                            active ? "bg-blue-600" : "bg-slate-100"
                          }`}
                          onPress={() => update({ primaryPaymentDay: day })}
                        >
                          <Text
                            className={`text-center text-sm font-semibold ${
                              active ? "text-white" : "text-slate-600"
                            }`}
                          >
                            Ориентир {day}-е
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}

            {canRemove ? (
              <Pressable
                onPress={onRemove}
                className="mt-3 flex-row items-center justify-center rounded-2xl py-3"
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text className="ml-1.5 text-sm font-semibold text-red-500">
                  Удалить
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </SwipeToDelete>
    </Animated.View>
  );
}
