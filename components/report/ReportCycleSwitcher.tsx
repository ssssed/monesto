import { useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { formatReportDate, type ReportCycle } from "@/lib/report/dateWindow";
import type { SalaryPaymentDay } from "@/lib/types";

const SPRING = { damping: 18, stiffness: 220, mass: 0.85 };

interface Props {
  cycles: ReportCycle[];
  selected: SalaryPaymentDay;
  onSelect: (day: SalaryPaymentDay) => void;
}

export function ReportCycleSwitcher({ cycles, selected, onSelect }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    cycles.findIndex((cycle) => cycle.paymentDay === selected),
  );
  const progress = useSharedValue(selectedIndex);

  useEffect(() => {
    progress.value = withSpring(selectedIndex, SPRING);
  }, [selectedIndex, progress]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const pillWidth =
    trackWidth > 0 ? (trackWidth - 12) / Math.max(cycles.length, 1) : 0;

  const pillStyle = useAnimatedStyle(() => ({
    width: pillWidth,
    transform: [{ translateX: 6 + progress.value * pillWidth }],
  }));

  return (
    <View
      className="mb-5 overflow-hidden rounded-3xl bg-slate-100"
      onLayout={onTrackLayout}
    >
      {pillWidth > 0 ? (
        <Animated.View style={[styles.pill, pillStyle]} />
      ) : null}

      <View className="flex-row p-1.5">
        {cycles.map((cycle) => {
          const active = cycle.paymentDay === selected;
          const shifted =
            cycle.payoutDate.getTime() !== cycle.nominalDate.getTime();

          return (
            <Pressable
              key={cycle.paymentDay}
              onPress={() => onSelect(cycle.paymentDay)}
              className="flex-1 rounded-2xl px-3 py-3"
              style={{ zIndex: 2 }}
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
                  className={`mt-0.5 text-[10px] ${active ? "text-slate-500" : "text-slate-400"}`}
                >
                  за {cycle.nominalDate.getDate()}-е
                </Text>
              ) : (
                <Text className="mt-0.5 text-[10px] text-slate-400">
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

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
