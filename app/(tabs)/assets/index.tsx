import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssetAvatar, TrendPill } from '@/components/assets/AssetAvatar';
import { AnimatedGoalBadge } from '@/components/ui/AnimatedProgress';
import { FadeInBlock, FadeInItem } from '@/components/ui/Motion';
import { getAllAssets } from '@/lib/db/assets';
import { convertToRub } from '@/lib/exchange/convertToRub';
import { calcUsdValuation } from '@/lib/exchange/usdValuation';
import type { Asset } from '@/lib/types';
import { formatMoney, formatRub } from '@/lib/utils/format';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

export default function AssetsScreen() {
  const usdRubRate = useExchangeRateStore((state) => state.usdRubRate);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    // Не монтируем тяжёлый AppLoader при каждом фокусе — это роняло Reanimated (nativeFlushQueue).
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      setAssets(await getAllAssets());
      hasLoadedOnce.current = true;
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const totalRub = assets.reduce((sum, asset) => {
    if (asset.provider === 'usd' && usdRubRate) {
      return sum + convertToRub(asset.current_amount, 'usd', usdRubRate);
    }
    return sum + asset.current_amount;
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <FadeInBlock>
          <View className="mb-5 items-center">
            <Text className="text-2xl font-bold text-slate-900">Ваши активы</Text>
            <Text className="mt-1 text-center text-sm text-slate-500">
              Отслеживайте активы и их доходность
            </Text>
          </View>
        </FadeInBlock>

        <FadeInItem index={0}>
          <View className="mb-6 rounded-3xl bg-blue-50 px-5 py-5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Итого
            </Text>
            <Text className="mt-1 text-3xl font-bold text-slate-900">{formatRub(totalRub)}</Text>
          </View>
        </FadeInItem>

        <Text className="mb-3 text-base font-bold text-slate-900">Ваши активы</Text>

        {assets.length === 0 ? (
          <View className="rounded-2xl bg-slate-50 p-6">
            <Text className="text-sm text-slate-500">Пока нет активов. Создайте первый.</Text>
          </View>
        ) : (
          assets.map((asset, index) => {
            const rubValue =
              asset.provider === 'usd' && usdRubRate
                ? convertToRub(asset.current_amount, 'usd', usdRubRate)
                : asset.current_amount;

            const valuation =
              asset.provider === 'usd' && usdRubRate
                ? calcUsdValuation(asset, usdRubRate)
                : null;

            const hasGoal = asset.goal_amount != null && asset.goal_amount > 0;
            const usdTrend =
              valuation?.profitPercent != null
                ? `${valuation.profitPercent >= 0 ? '+' : ''}${valuation.profitPercent}%`
                : null;

            return (
              <FadeInItem key={asset.id} index={index + 1}>
                <Link href={`/(tabs)/assets/${asset.id}`} asChild>
                  <Pressable className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-white px-3 py-3.5">
                    <AssetAvatar
                      icon={asset.icon}
                      bgColor={asset.bg_color}
                      iconColor={asset.icon_color}
                      size={52}
                    />
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className="mr-2 flex-1 text-base font-semibold text-slate-900"
                          numberOfLines={1}>
                          {asset.name}
                        </Text>
                        {hasGoal ? (
                          <AnimatedGoalBadge
                            current={asset.current_amount}
                            goal={asset.goal_amount as number}
                          />
                        ) : usdTrend ? (
                          <TrendPill
                            value={usdTrend}
                            positive={!usdTrend.startsWith('−') && !usdTrend.startsWith('-')}
                          />
                        ) : null}
                      </View>
                      {asset.provider === 'usd' ? (
                        <>
                          <Text className="mt-1 text-lg font-bold text-slate-900">
                            {formatMoney(asset.current_amount, 'usd')}
                          </Text>
                          <Text className="text-sm text-slate-500">{formatRub(rubValue)}</Text>
                        </>
                      ) : (
                        <Text className="mt-1 text-lg font-bold text-slate-900">
                          {formatRub(asset.current_amount)}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </Link>
              </FadeInItem>
            );
          })
        )}

        <Link href="/(tabs)/assets/new" asChild>
          <Pressable className="mt-2 items-center py-4">
            <Text className="text-base font-semibold text-blue-600">+ Добавить актив</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
