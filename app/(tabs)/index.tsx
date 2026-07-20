import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeConfirmCard } from '@/components/report/SwipeConfirmCard';
import { AppLoader } from '@/components/ui/AppLoader';
import { FadeInBlock, FadeInItem } from '@/components/ui/Motion';
import { depositFromAllocation, getAllAssets } from '@/lib/db/assets';
import { confirmAllocation, getConfirmedRuleIds } from '@/lib/db/confirmations';
import { getAllExpenses } from '@/lib/db/expenses';
import { getAllIncomes } from '@/lib/db/incomes';
import { getAllRules } from '@/lib/db/rules';
import { calculateReport, isReportError } from '@/lib/report/calculateReport';
import { formatReportDate } from '@/lib/report/dateWindow';
import type { Asset, ReportResult, RuleAllocation } from '@/lib/types';
import { formatRub, formatUsd } from '@/lib/utils/format';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

export default function HomeScreen() {
  const usdRubRate = useExchangeRateStore((state) => state.usdRubRate);
  const isLoadingRate = useExchangeRateStore((state) => state.isLoading);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const loadReport = useCallback(async () => {
    // Лоадер и remount только при первой загрузке — иначе анимации играют снова.
    if (!hasLoadedOnce.current) setLoading(true);

    const [incomes, expenses, rules, assetRows] = await Promise.all([
      getAllIncomes(),
      getAllExpenses(),
      getAllRules(),
      getAllAssets(),
    ]);

    const result = calculateReport({
      incomes,
      expenses,
      rules,
      assets: assetRows,
      today: new Date(),
      usdRubRate: usdRubRate ?? undefined,
    });

    if (isReportError(result)) {
      setErrorMessage(result.message);
      setReport(null);
      setAssets(assetRows);
      setLoading(false);
      return;
    }

    const confirmed = await getConfirmedRuleIds(result.cycleKey);
    setConfirmedIds(confirmed);
    setReport(result);
    setAssets(assetRows);
    setErrorMessage(null);
    hasLoadedOnce.current = true;
    setLoading(false);
  }, [usdRubRate]);

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

    const allocations = allocationsByAsset.get(assetId) ?? [];
    const pending = allocations.filter((item) => !confirmedIds.includes(item.ruleId));
    if (pending.length === 0) {
      Alert.alert('Уже подтверждено', 'Пополнение этого актива в текущем цикле уже засчитано.');
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
      if (status === 'ok') {
        newlyConfirmed.push(item.ruleId);
      }
    }

    if (newlyConfirmed.length === 0) {
      Alert.alert('Уже подтверждено', 'Повторное подтверждение невозможно.');
      setConfirmedIds((prev) => [...new Set([...prev, ...pending.map((p) => p.ruleId)])]);
      return;
    }

    await depositFromAllocation(assetId, totalRub, usdRubRate, 'Распределение из отчёта');
    setConfirmedIds((prev) => [...new Set([...prev, ...newlyConfirmed])]);
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

  const hasPendingAllocations = report.allocations.some(
    (item) => item.targetAssetId != null && !confirmedIds.includes(item.ruleId),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}>
          <FadeInBlock>
            <Text className="mb-1 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Monesto
            </Text>
            <Text className="mb-1 text-2xl font-bold text-slate-900">
              К {formatReportDate(report.targetDate)}
            </Text>
            <Text className="mb-5 text-sm text-slate-500">Отчёт по доходам и расходам</Text>
          </FadeInBlock>

          {/* enter animations: first mount only */}
          <FadeInItem index={0}>
            <View className="mb-5 rounded-3xl bg-slate-900 px-5 py-5">
              <Text className="text-sm text-slate-300">Свободные деньги</Text>
              <Text className="mt-1 text-4xl font-bold text-white" testID="report-free-money">
                {formatRub(report.freeMoney)}
              </Text>
            </View>
          </FadeInItem>

          <FadeInItem index={1}>
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
          </FadeInItem>

          <FadeInItem index={2}>
            <View className="mb-6 rounded-2xl border border-slate-100 p-4">
              <Text className="mb-2 text-sm font-semibold text-slate-900">Остаток до правил</Text>
              <Text className="text-2xl font-bold text-slate-900">{formatRub(report.remainder)}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                Распределение: −{formatRub(report.totalAllocations)}
              </Text>
            </View>
          </FadeInItem>

          <Text className="mb-1 text-lg font-bold text-slate-900">Ваши активы</Text>
          <Text className="mb-4 text-sm leading-5 text-slate-500">
            {hasPendingAllocations
              ? 'Справа сумма к пополнению по правилам. Сдвиньте карточку вправо, чтобы зачислить средства на актив. Повторно подтвердить тот же цикл нельзя — появится зелёная галочка.'
              : 'Текущие балансы активов. Когда появятся правила распределения, здесь можно будет подтвердить пополнение свайпом.'}
          </Text>

          {(report.assetSummary ?? []).length === 0 ? (
            <Text className="text-sm text-slate-500">Активов пока нет</Text>
          ) : (
            (report.assetSummary ?? []).map((item, index) => {
              const related = allocationsByAsset.get(item.id) ?? [];
              const pending = related.filter((a) => !confirmedIds.includes(a.ruleId));
              const allConfirmed =
                related.length > 0 && related.every((a) => confirmedIds.includes(a.ruleId));
              const incoming = pending.reduce((sum, a) => sum + a.amountRub, 0) || item.incomingRub;

              return (
                <FadeInItem key={item.id} index={index + 3}>
                  <SwipeConfirmCard
                    title={item.name}
                    balanceLabel={
                      item.provider === 'usd'
                        ? `${formatUsd(item.nativeAmount)} · ${formatRub(item.rubEquivalent)}`
                        : formatRub(item.nativeAmount)
                    }
                    incomingRub={allConfirmed ? item.incomingRub : incoming}
                    icon={item.icon}
                    bgColor={item.bg_color}
                    iconColor={item.icon_color}
                    confirmed={allConfirmed}
                    swipeable={pending.length > 0}
                    onConfirm={() => handleConfirmAsset(item.id)}
                  />
                </FadeInItem>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
