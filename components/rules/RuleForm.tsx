import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { getAllAssets } from '@/lib/db/assets';
import { ASSET_PROVIDERS } from '@/lib/providers/assetProviders';
import type { Asset, DistributionRule, RuleType } from '@/lib/types';

interface Props {
  initial?: DistributionRule;
  onSubmit: (rule: Omit<DistributionRule, 'id'>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function RuleForm({ initial, onSubmit, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [ruleType, setRuleType] = useState<RuleType>(initial?.rule_type ?? 'percent');
  const [value, setValue] = useState(String(initial?.value ?? ''));
  const [targetAssetId, setTargetAssetId] = useState<number | null>(
    initial?.target_asset_id ?? null,
  );
  const [assets, setAssets] = useState<Asset[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllAssets().then(setAssets);
  }, []);

  const selectedAsset = assets.find((asset) => asset.id === targetAssetId);

  const handleSave = async () => {
    if (!name.trim() || !Number(value)) {
      Alert.alert('Ошибка', 'Заполните название и значение');
      return;
    }
    if (targetAssetId == null) {
      Alert.alert('Ошибка', 'Выберите актив, к которому применяется правило');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        rule_type: ruleType,
        value: Number(value),
        currency: selectedAsset?.provider === 'usd' ? 'asset' : 'rub',
        target_asset_id: targetAssetId,
        sort_order: initial?.sort_order ?? 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
      <Text className="mb-1 text-2xl font-bold text-slate-900">
        {initial ? 'Правило' : 'Новое правило'}
      </Text>
      <Text className="mb-5 text-sm text-slate-500">
        Выберите актив и способ расчёта суммы
      </Text>

      <Text className="mb-2 text-sm font-medium text-slate-700">Название</Text>
      <TextInput
        className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base"
        placeholder="Например, Подушка безопасности"
        value={name}
        onChangeText={setName}
      />

      <Text className="mb-2 text-sm font-medium text-slate-700">Актив</Text>
      {assets.length === 0 ? (
        <View className="mb-4 rounded-2xl bg-amber-50 px-4 py-3">
          <Text className="text-sm text-amber-800">
            Сначала создайте актив на вкладке «Активы»
          </Text>
        </View>
      ) : (
        <View className="mb-4">
          {assets.map((asset) => {
            const selected = targetAssetId === asset.id;
            return (
              <Pressable
                key={asset.id}
                onPress={() => setTargetAssetId(asset.id)}
                className={`mb-2 flex-row items-center rounded-2xl border px-3 py-3 ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white'}`}>
                <AssetAvatar
                  icon={asset.icon}
                  bgColor={asset.bg_color}
                  iconColor={asset.icon_color}
                  size={40}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-slate-900">{asset.name}</Text>
                  <Text className="text-xs text-slate-500">
                    {ASSET_PROVIDERS[asset.provider].label}
                  </Text>
                </View>
                <View
                  className={`h-5 w-5 rounded-full border-2 ${selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      <Text className="mb-2 text-sm font-medium text-slate-700">Тип</Text>
      <View className="mb-4 flex-row rounded-2xl bg-slate-100 p-1">
        {([
          { key: 'percent' as const, label: 'Процент' },
          { key: 'fixed' as const, label: 'Фикс' },
        ]).map((item) => (
          <Pressable
            key={item.key}
            className={`flex-1 rounded-xl py-3 ${ruleType === item.key ? 'bg-white' : ''}`}
            onPress={() => setRuleType(item.key)}>
            <Text
              className={`text-center text-sm font-semibold ${ruleType === item.key ? 'text-slate-900' : 'text-slate-500'}`}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-2 text-sm font-medium text-slate-700">
        {ruleType === 'percent'
          ? 'Процент от остатка'
          : selectedAsset?.provider === 'usd'
            ? 'Сумма в USD'
            : 'Сумма в ₽'}
      </Text>
      <TextInput
        className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base"
        placeholder={ruleType === 'percent' ? '10' : '15000'}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
      />
      <Text className="mb-6 text-xs leading-4 text-slate-400">
        {ruleType === 'percent'
          ? 'Считается от остатка (доход − расходы), не каскадно'
          : selectedAsset?.provider === 'usd'
            ? 'Фикс в USD будет конвертирован по текущему курсу'
            : 'Фиксированная сумма в рублях каждый цикл'}
      </Text>

      <Pressable
        className={`mb-3 rounded-2xl py-4 ${saving ? 'bg-blue-300' : 'bg-blue-600'}`}
        disabled={saving}
        onPress={handleSave}>
        <Text className="text-center text-base font-semibold text-white">Сохранить</Text>
      </Pressable>

      {onDelete ? (
        <Pressable className="rounded-2xl border border-red-200 bg-red-50 py-4" onPress={onDelete}>
          <Text className="text-center text-base font-semibold text-red-600">Удалить правило</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
