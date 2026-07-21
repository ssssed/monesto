import { Link, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AssetAvatar, TrendPill } from "@/components/assets/AssetAvatar";
import { AnimatedGoalBadge } from "@/components/ui/AnimatedProgress";
import { FadeInBlock, FadeInItem } from "@/components/ui/Motion";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { UndoToast } from "@/components/ui/UndoToast";
import { deleteAsset, getAllAssets } from "@/lib/db/assets";
import { convertToRub } from "@/lib/exchange/convertToRub";
import { calcUsdValuation } from "@/lib/exchange/usdValuation";
import type { Asset } from "@/lib/types";
import { formatMoney, formatRub } from "@/lib/utils/format";
import { useExchangeRateStore } from "@/stores/exchange-rate-store";

const UNDO_MS = 7000;

type PendingDelete = {
  asset: Asset;
  timer: ReturnType<typeof setTimeout>;
};

export default function AssetsScreen() {
  const usdRubRate = useExchangeRateStore((state) => state.usdRubRate);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ assetId: number; name: string } | null>(
    null,
  );
  const hasLoadedOnce = useRef(false);
  const pendingRef = useRef(new Map<number, PendingDelete>());
  const mountedRef = useRef(true);

  const commitDelete = useCallback(async (assetId: number) => {
    pendingRef.current.delete(assetId);
    try {
      await deleteAsset(assetId);
    } catch {
      // если уже удалено — ок
    }
    if (mountedRef.current) {
      setToast((prev) => (prev?.assetId === assetId ? null : prev));
    }
  }, []);

  const scheduleDelete = useCallback(
    (asset: Asset) => {
      const existing = pendingRef.current.get(asset.id);
      if (existing) clearTimeout(existing.timer);

      setAssets((prev) => prev.filter((item) => item.id !== asset.id));

      const timer = setTimeout(() => {
        void commitDelete(asset.id);
      }, UNDO_MS);

      pendingRef.current.set(asset.id, { asset, timer });
      setToast({ assetId: asset.id, name: asset.name });
    },
    [commitDelete],
  );

  const undoDelete = useCallback(() => {
    if (!toast) return;
    const pending = pendingRef.current.get(toast.assetId);
    if (!pending) {
      setToast(null);
      return;
    }

    clearTimeout(pending.timer);
    pendingRef.current.delete(toast.assetId);
    setAssets((prev) => [...prev, pending.asset].sort((a, b) => a.id - b.id));
    setToast(null);
  }, [toast]);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const load = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const all = await getAllAssets();
      const pendingIds = new Set(pendingRef.current.keys());
      setAssets(all.filter((asset) => !pendingIds.has(asset.id)));
      hasLoadedOnce.current = true;
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      load();
      return () => {
        mountedRef.current = false;
      };
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
    if (asset.provider === "usd" && usdRubRate) {
      return sum + convertToRub(asset.current_amount, "usd", usdRubRate);
    }
    return sum + asset.current_amount;
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <UndoToast
        visible={toast != null}
        message={toast ? `Удалено «${toast.name}»` : ""}
        durationMs={UNDO_MS}
        onUndo={undoDelete}
        onDismiss={dismissToast}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <FadeInBlock>
          <View className="mb-5 items-center">
            <Text className="text-2xl font-bold text-slate-900">
              Ваши активы
            </Text>
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
            <Text className="mt-1 text-3xl font-bold text-slate-900">
              {formatRub(totalRub)}
            </Text>
          </View>
        </FadeInItem>

        <Text className="mb-3 text-base font-bold text-slate-900">
          Ваши активы
        </Text>

        {assets.length === 0 ? (
          <View className="rounded-2xl bg-slate-50 p-6">
            <Text className="text-sm text-slate-500">
              Пока нет активов. Создайте первый.
            </Text>
          </View>
        ) : (
          assets.map((asset, index) => {
            const rubValue =
              asset.provider === "usd" && usdRubRate
                ? convertToRub(asset.current_amount, "usd", usdRubRate)
                : asset.current_amount;

            const valuation =
              asset.provider === "usd" && usdRubRate
                ? calcUsdValuation(asset, usdRubRate)
                : null;

            const hasGoal = asset.goal_amount != null && asset.goal_amount > 0;
            const usdTrend =
              valuation?.profitPercent != null
                ? `${valuation.profitPercent >= 0 ? "+" : ""}${valuation.profitPercent}%`
                : null;

            return (
              <FadeInItem key={asset.id} index={index + 1}>
                <View className="mb-3">
                  <SwipeToDelete
                    borderRadius={16}
                    onDelete={() => scheduleDelete(asset)}
                  >
                    <Link href={`/(tabs)/assets/${asset.id}`} asChild>
                      <Pressable className="flex-row items-center bg-white px-3 py-3.5">
                        <AssetAvatar
                          icon={asset.icon}
                          bgColor={asset.bg_color}
                          iconColor={asset.icon_color}
                          size={52}
                        />
                        <View className="ml-3 flex-1">
                          <View className="flex-row items-center justify-between gap-2">
                            <Text
                              className="min-w-0 flex-1 text-base font-semibold leading-5 text-slate-900"
                              numberOfLines={1}
                            >
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
                                positive={
                                  !usdTrend.startsWith("−") &&
                                  !usdTrend.startsWith("-")
                                }
                              />
                            ) : null}
                          </View>
                          {asset.provider === "usd" ? (
                            <>
                              <Text className="mt-0.5 text-lg font-bold leading-6 text-slate-900">
                                {formatMoney(asset.current_amount, "usd")}
                              </Text>
                              <Text className="text-sm text-slate-500">
                                {formatRub(rubValue)}
                              </Text>
                            </>
                          ) : (
                            <Text className="mt-0.5 text-lg font-bold leading-6 text-slate-900">
                              {formatRub(asset.current_amount)}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    </Link>
                  </SwipeToDelete>
                </View>
              </FadeInItem>
            );
          })
        )}

        <Link href="/(tabs)/assets/new" asChild>
          <Pressable className="mt-2 items-center py-4">
            <Text className="text-base font-semibold text-blue-600">
              + Добавить актив
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
