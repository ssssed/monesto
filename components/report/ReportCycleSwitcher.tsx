import { Pressable, Text, View } from "react-native";

import { formatReportDate, type ReportCycle } from "@/lib/report/dateWindow";
import type { SalaryPaymentDay } from "@/lib/types";

interface Props {
  cycles: ReportCycle[];
  selected: SalaryPaymentDay;
  onSelect: (day: SalaryPaymentDay) => void;
}

export function ReportCycleSwitcher({ cycles, selected, onSelect }: Props) {
  return (
    <View className="mb-5 rounded-3xl bg-slate-100 p-1.5">
      <View className="flex-row gap-1">
        {cycles.map((cycle) => {
          const active = cycle.paymentDay === selected;
          const shifted =
            cycle.payoutDate.getTime() !== cycle.nominalDate.getTime();

          return (
            <Pressable
              key={cycle.paymentDay}
              onPress={() => onSelect(cycle.paymentDay)}
              className={`flex-1 rounded-2xl px-3 py-3 ${active ? "bg-white" : ""}`}
              style={
                active
                  ? {
                      shadowColor: "#0f172a",
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wide ${
                    active ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  {cycle.paymentDay}-е
                </Text>
                <View
                  className={`rounded-full px-1.5 py-0.5 ${
                    cycle.isPreview
                      ? active
                        ? "bg-blue-50"
                        : "bg-slate-200/80"
                      : active
                        ? "bg-emerald-50"
                        : "bg-slate-200/80"
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold uppercase ${
                      cycle.isPreview
                        ? active
                          ? "text-blue-600"
                          : "text-slate-500"
                        : active
                          ? "text-emerald-700"
                          : "text-slate-500"
                    }`}
                  >
                    {cycle.isPreview ? "план" : "сейчас"}
                  </Text>
                </View>
              </View>

              <Text
                className={`mt-1.5 text-base font-bold ${
                  active ? "text-slate-900" : "text-slate-500"
                }`}
                numberOfLines={1}
              >
                {formatReportDate(cycle.payoutDate)}
              </Text>

              {shifted ? (
                <Text
                  className={`mt-0.5 text-[10px] ${
                    active ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  за {cycle.nominalDate.getDate()}-е
                </Text>
              ) : (
                <Text
                  className={`mt-0.5 text-[10px] ${
                    active ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  {cycle.isPreview ? "будущий цикл" : "текущий цикл"}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
