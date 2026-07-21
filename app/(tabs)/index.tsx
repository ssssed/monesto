import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GLASS_TAB_BAR_CONTENT_INSET } from '@/components/navigation/GlassTabBar';
import { ReportCycleSwitcher } from '@/components/report/ReportCycleSwitcher';
import { SwipeConfirmCard } from '@/components/report/SwipeConfirmCard';
import { AppLoader } from '@/components/ui/AppLoader';
import { FadeInBlock, FadeInItem } from '@/components/ui/Motion';
import { depositFromAllocation, getAllAssets } from '@/lib/db/assets';
import {
  confirmAllocation,
  getConfirmedRuleIds,
  getRejectedRuleIds,
  rejectAllocation,
} from '@/lib/db/confirmations';
import { getAllExpenses } from '@/lib/db/expenses';
import { getAllIncomes } from '@/lib/db/incomes';
import { getAllRules } from '@/lib/db/rules';
import { calculateReport, isReportError } from '@/lib/report/calculateReport';
import {
  formatReportDate,
  listReportCycles,
  type ReportCycle,
} from '@/lib/report/dateWindow';
import type { ReportResult, RuleAllocation, SalaryPaymentDay } from '@/lib/types';
import { formatRub, formatUsd } from '@/lib/utils/format';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

const EASE = Easing.out(Easing.cubic);

export default function HomeScreen() {
  const usdRubRate = useExchangeRateStore((state) => state.usdRubRate);
  const isLoadingRate = useExchangeRateStore((state) => state.isLoading);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [cycles, setCycles] = useState(() => listReportCycles(new Date()));
  const [selectedDay, setSelectedDay] = useState<SalaryPaymentDay | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<number[]>([]);
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transitionDir, setTransitionDir] = useState<1 | -1>(1);
  const hasLoadedOnce = useRef(false);
  const selectedDayRef = useRef<SalaryPaymentDay | null>(null);
  const cyclesRef = useRef<ReportCycle[]>(cycles);

  const loadReport = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true);

    const today = new Date();
    const availableCycles = listReportCycles(today);
    cyclesRef.current = availableCycles;
    setCycles(availableCycles);

    const [incomes, expenses, rules, assetRows] = await Promise.all([
      getAllIncomes(),
      getAllExpenses(),
      getAllRules(),
      getAllAssets(),
    ]);

    const currentCycle = availableCycles.find((cycle) => !cycle.isPreview);
    const preferred =
      selectedDayRef.current ??
      currentCycle?.paymentDay ??
      availableCycles[0]?.paymentDay ??
      25;
    const cyclePaymentDay = availableCycles.some((c) => c.paymentDay === preferred)
      ? preferred
      : (availableCycles[0]?.paymentDay ?? 25);

    if (selectedDayRef.current == null) {
      selectedDayRef.current = cyclePaymentDay;
      setSelectedDay(cyclePaymentDay);
    }

    const result = calculateReport({
      incomes,
      expenses,
      rules,
      assets: assetRows,
      today,
      usdRubRate: usdRubRate ?? undefined,
      cyclePaymentDay,
    });

    if (isReportError(result)) {
      setErrorMessage(result.message);
      setReport(null);
      setLoading(false);
      return;
    }

    const [confirmed, rejected] = await Promise.all([
      getConfirmedRuleIds(result.cycleKey),
      getRejectedRuleIds(result.cycleKey),
    ]);
    setConfirmedIds(confirmed);
    setRejectedIds(rejected);
    setReport(result);
    setErrorMessage(null);
    hasLoadedOnce.current = true;
    setLoading(false);
  }, [usdRubRate]);

  const handleSelectCycle = useCallback(
    (day: SalaryPaymentDay) => {
      if (selectedDayRef.current === day) return;

      const list = cyclesRef.current;
      const prevIndex = list.findIndex((c) => c.paymentDay === selectedDayRef.current);
      const nextIndex = list.findIndex((c) => c.paymentDay === day);
      if (prevIndex >= 0 && nextIndex >= 0) {
        setTransitionDir(nextIndex > prevIndex ? 1 : -1);
      }

      selectedDayRef.current = day;
      setSelectedDay(day);
      void loadReport();
    },
    [loadReport],
  );

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport]),
  );

  const allocationsByAsset = useMemo(() => {
    const map = new Map<number, RuleAllocation[]>();
    if (!report) return map;
    for (const allocation of report.allocations) {
      if (allocation.targetAssetId == null) continue;
      const list = map.get(allocation.targetAssetId) ?? [];
      list.push(allocation);
      map.set(allocation.targetAssetId, list);
    }
    return map;
  }, [report]);

  const handleConfirmAsset = async (assetId: number) => {
    if (!report || !usdRubRate) return;
    if (report.isPreview) {
      Alert.alert(
        'Пока рано',
        'Подтверждать распределение можно после выплаты в этом цикле.',
      );
      return;
    }

    const allocations = allocationsByAsset.get(assetId) ?? [];
    const pending = allocations.filter(
      (item) => !confirmedIds.includes(item.ruleId) && !rejectedIds.includes(item.ruleId),
    );
    if (pending.length === 0) {
      Alert.alert(
        'Уже обработано',
        'Пополнение этого актива в текущем цикле уже засчитано или отклонено.',
      );
      return;
    }

    const totalRub = pending.reduce((sum, item) => sum + item.amountRub, 0);
    const newlyConfirmed: number[] = [];

    for (const item of pending) {
      const status = await confirmAllocation({
        ruleId: item.ruleId,
        cycleKey: report.cycleKey,
        amountRub: item.amountRub,
      });
      if (status === 'ok') newlyConfirmed.push(item.ruleId);
    }

    if (newlyConfirmed.length === 0) {
      Alert.alert('Уже обработано', 'Повторное подтверждение невозможно.');
      setConfirmedIds((prev) => [...new Set([...prev, ...pending.map((p) => p.ruleId)])]);
      return;
    }

    await depositFromAllocation(assetId, totalRub, usdRubRate, 'Распределение из отчёта');
    setConfirmedIds((prev) => [...new Set([...prev, ...newlyConfirmed])]);
    await loadReport();
  };

  const handleRejectAsset = async (assetId: number) => {
    if (!report) return;
    if (report.isPreview) return;

    const allocations = allocationsByAsset.get(assetId) ?? [];
    const pending = allocations.filter(
      (item) => !confirmedIds.includes(item.ruleId) && !rejectedIds.includes(item.ruleId),
    );
    if (pending.length === 0) return;

    const newlyRejected: number[] = [];
    for (const item of pending) {
      const status = await rejectAllocation({
        ruleId: item.ruleId,
        cycleKey: report.cycleKey,
      });
      if (status === 'ok') newlyRejected.push(item.ruleId);
    }

    setRejectedIds((prev) => [...new Set([...prev, ...newlyRejected])]);
    await loadReport();
  };

  if (!hasLoadedOnce.current && (loading || isLoadingRate)) {
    return <AppLoader message="Считаем отчёт..." />;
  }

  if (errorMessage || !report) {
    return (
      <SafeAreaView className="flex-1 bg-white px-4 pt-6" edges={['top']}>
        <Text className="text-base text-slate-700">
          {errorMessage ?? 'Не удалось построить отчёт. Проверьте доходы в настройках.'}
        </Text>
      </SafeAreaView>
    );
  }

  const activeDay = selectedDay ?? report.paymentDay;
  const canSwipeAssets = !report.isPreview;
  const hasPendingAllocations =
    canSwipeAssets &&
    report.allocations.some(
      (item) =>
        item.targetAssetId != null &&
        !confirmedIds.includes(item.ruleId) &&
        !rejectedIds.includes(item.ruleId),
    );

  const assetsWithChanges = (report.assetSummary ?? []).filter((item) => {
    const related = allocationsByAsset.get(item.id) ?? [];
    return related.length > 0;
  });

  const payoutShifted = report.payoutDate.getTime() !== report.nominalDate.getTime();

  const entering =
    transitionDir > 0
      ? FadeInRight.duration(280).easing(EASE)
      : FadeInLeft.duration(280).easing(EASE);
  const exiting =
    transitionDir > 0
      ? FadeOutLeft.duration(200).easing(EASE)
      : FadeOutRight.duration(200).easing(EASE);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: GLASS_TAB_BAR_CONTENT_INSET + 24,
          }}
          showsVerticalScrollIndicator={false}>
          <FadeInBlock>
            <Text className="mb-1 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Monesto
            </Text>
          </FadeInBlock>

          <FadeInItem index={0}>
            <ReportCycleSwitcher
              cycles={cycles}
              selected={activeDay}
              onSelect={handleSelectCycle}
            />
          </FadeInItem>

          <Animated.View key={report.cycleKey} entering={entering} exiting={exiting}>
            <Text className="mb-1 text-2xl font-bold text-slate-900">
              {report.isPreview ? 'План к ' : 'Цикл к '}
              {formatReportDate(report.payoutDate)}
            </Text>
            <Text className="mb-5 text-sm text-slate-500">
              {report.isPreview
                ? 'Будущий бюджет: доходы, расходы и свободные деньги'
                : 'Текущий отчёт по доходам и расходам'}
              {payoutShifted ? ` · выплата за ${report.nominalDate.getDate()}-е` : ''}
            </Text>

            <View className="mb-5 rounded-3xl bg-slate-900 px-5 py-5">
              <Text className="text-sm text-slate-300">
                {report.isPreview ? 'Свободные (план)' : 'Свободные деньги'}
              </Text>
              <Text className="mt-1 text-4xl font-bold text-white" testID="report-free-money">
                {formatRub(report.freeMoney)}
              </Text>
              {report.isPreview ? (
                <Text className="mt-2 text-xs leading-4 text-slate-400">
                  Подтверждать пополнения можно после {formatReportDate(report.payoutDate)}
                </Text>
              ) : null}
            </View>

            <View className="mb-5 flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-emerald-50 p-4">
                <Text className="text-xs font-semibold uppercase text-emerald-700">Доходы</Text>
                <Text className="mt-2 text-xl font-bold text-emerald-800">
                  {formatRub(report.totalIncome)}
                </Text>
                {report.incomeLines.slice(0, 3).map((line, index) => (
                  <Text key={`${line.name}-${index}`} className="mt-1 text-xs text-emerald-700">
                    {line.name}: {formatRub(line.amount)}
                  </Text>
                ))}
              </View>
              <View className="flex-1 rounded-2xl bg-red-50 p-4">
                <Text className="text-xs font-semibold uppercase text-red-600">Расходы</Text>
                <Text className="mt-2 text-xl font-bold text-red-700">
                  {formatRub(report.totalExpenses)}
                </Text>
                {report.expenseLines.slice(0, 3).map((line, index) => (
                  <Text key={`${line.name}-${index}`} className="mt-1 text-xs text-red-600">
                    {line.name}: {formatRub(line.amount)}
                  </Text>
                ))}
              </View>
            </View>

            <View className="mb-6 rounded-2xl border border-slate-100 p-4">
              <Text className="mb-2 text-sm font-semibold text-slate-900">Остаток до правил</Text>
              <Text className="text-2xl font-bold text-slate-900">
                {formatRub(report.remainder)}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Распределение: −{formatRub(report.totalAllocations)}
              </Text>
            </View>

            <Text className="mb-1 text-lg font-bold text-slate-900">Ваши активы</Text>
            <Text className="mb-4 text-sm leading-5 text-slate-500">
              {report.isPreview
                ? 'В плане цикла можно посмотреть будущие пополнения. Свайп станет доступен после выплаты.'
                : hasPendingAllocations
                  ? 'Вправо — зачислить пополнение. Влево — отклонить. Решение действует до конца цикла.'
                  : assetsWithChanges.length > 0
                    ? 'В этом цикле все пополнения уже обработаны.'
                    : 'Нет активов с распределением в текущем цикле. Добавьте правила в настройках.'}
            </Text>

            {assetsWithChanges.length === 0 ? (
              <Text className="text-sm text-slate-500">Нет активов к пополнению</Text>
            ) : (
              assetsWithChanges.map((item) => {
                const related = allocationsByAsset.get(item.id) ?? [];
                const pending = related.filter(
                  (a) => !confirmedIds.includes(a.ruleId) && !rejectedIds.includes(a.ruleId),
                );
                const allConfirmed =
                  related.length > 0 && related.every((a) => confirmedIds.includes(a.ruleId));
                const allRejected =
                  related.length > 0 &&
                  related.every((a) => rejectedIds.includes(a.ruleId)) &&
                  !allConfirmed;
                const incoming =
                  pending.reduce((sum, a) => sum + a.amountRub, 0) ||
                  (allConfirmed ? item.incomingRub : 0);

                return (
                  <SwipeConfirmCard
                    key={item.id}
                    title={item.name}
                    balanceLabel={
                      item.provider === 'usd'
                        ? `${formatUsd(item.nativeAmount)} · ${formatRub(item.rubEquivalent)}`
                        : formatRub(item.nativeAmount)
                    }
                    incomingRub={incoming}
                    icon={item.icon}
                    bgColor={item.bg_color}
                    iconColor={item.icon_color}
                    confirmed={allConfirmed}
                    rejected={allRejected}
                    swipeable={canSwipeAssets && pending.length > 0}
                    onConfirm={() => handleConfirmAsset(item.id)}
                    onReject={() => handleRejectAsset(item.id)}
                  />
                );
              })
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
