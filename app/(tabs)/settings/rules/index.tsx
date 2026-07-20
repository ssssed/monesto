import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { getAllAssets } from '@/lib/db/assets';
import { getAllRules } from '@/lib/db/rules';
import { ASSET_PROVIDERS } from '@/lib/providers/assetProviders';
import type { Asset, DistributionRule } from '@/lib/types';
import { formatRub } from '@/lib/utils/format';

export default function RulesScreen() {
  const [rules, setRules] = useState<DistributionRule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [ruleRows, assetRows] = await Promise.all([getAllRules(), getAllAssets()]);
    setRules(ruleRows);
    setAssets(assetRows);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const assetMap = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);

  const totalPercent = rules
    .filter((rule) => rule.rule_type === 'percent')
    .reduce((sum, rule) => sum + rule.value, 0);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={[]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-slate-900">Авто-распределение</Text>
        <Text className="mt-2 text-sm leading-5 text-slate-500">
          Правила решают, какая часть остатка уходит в каждый актив после зарплаты
        </Text>

        <View className="mb-6 mt-5 rounded-3xl bg-slate-900 px-5 py-5">
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-sm text-slate-300">Активных правил</Text>
              <Text className="mt-1 text-3xl font-bold text-white">{rules.length}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-slate-300">% от остатка</Text>
              <Text className="mt-1 text-2xl font-bold text-blue-300">{totalPercent}%</Text>
            </View>
          </View>
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
            <View
              className="h-2 rounded-full bg-blue-400"
              style={{ width: `${Math.min(totalPercent, 100)}%` }}
            />
          </View>
        </View>

        <Link href="/(tabs)/settings/rules/new" asChild>
          <Pressable className="mb-5 flex-row items-center justify-center rounded-2xl bg-blue-600 py-4">
            <Ionicons name="add" size={20} color="#fff" />
            <Text className="ml-1 text-base font-semibold text-white">Создать правило</Text>
          </Pressable>
        </Link>

        {rules.length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="git-branch-outline" size={26} color="#2563eb" />
            </View>
            <Text className="text-center text-base font-semibold text-slate-900">
              Пока нет правил
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
              Создайте правило, чтобы остаток автоматически уходил в выбранный актив
            </Text>
          </View>
        ) : (
          rules.map((rule) => {
            const asset =
              rule.target_asset_id != null ? assetMap.get(rule.target_asset_id) : undefined;
            return (
              <Link key={rule.id} href={`/(tabs)/settings/rules/${rule.id}`} asChild>
                <Pressable className="mb-3 rounded-3xl border border-slate-100 bg-white p-4">
                  <View className="flex-row items-center">
                    {asset ? (
                      <AssetAvatar
                        icon={asset.icon}
                        bgColor={asset.bg_color}
                        iconColor={asset.icon_color}
                        size={48}
                      />
                    ) : (
                      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                        <Ionicons name="ellipse-outline" size={22} color="#64748b" />
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-slate-900">{rule.name}</Text>
                      <Text className="mt-0.5 text-sm text-slate-500">
                        {asset
                          ? `${asset.name} · ${ASSET_PROVIDERS[asset.provider].label}`
                          : 'Актив не выбран'}
                      </Text>
                    </View>
                    <View className="rounded-full bg-blue-50 px-3 py-1.5">
                      <Text className="text-sm font-bold text-blue-600">
                        {rule.rule_type === 'percent'
                          ? `${rule.value}%`
                          : rule.currency === 'asset'
                            ? `${rule.value}`
                            : formatRub(rule.value)}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-xs leading-4 text-slate-400">
                    {rule.rule_type === 'percent'
                      ? `${rule.value}% от остатка после расходов`
                      : rule.currency === 'asset'
                        ? `Фиксированная сумма в валюте актива`
                        : `Фиксированно ${formatRub(rule.value)}`}
                  </Text>
                </Pressable>
              </Link>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
