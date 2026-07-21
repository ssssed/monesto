import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssetAvatar, TrendPill } from '@/components/assets/AssetAvatar';
import { AssetStylePicker } from '@/components/assets/AssetStylePicker';
import { AnimatedPercentLabel, AnimatedProgressBar } from '@/components/ui/AnimatedProgress';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FadeInBlock, FadeInItem } from '@/components/ui/Motion';
import {
  addTransaction,
  getAssetById,
  getTransactions,
  updateAsset,
} from '@/lib/db/assets';
import { ASSET_PROVIDERS } from '@/lib/providers/assetProviders';
import { calcUsdValuation } from '@/lib/exchange/usdValuation';
import type { Asset, AssetTransaction } from '@/lib/types';
import { formatMoney, formatRub } from '@/lib/utils/format';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

type TxMode = 'deposit' | 'withdraw' | null;

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const usdRubRate = useExchangeRateStore((state) => state.usdRubRate);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [transactions, setTransactions] = useState<AssetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<TxMode>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [buyRate, setBuyRate] = useState('');
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editIcon, setEditIcon] = useState('wallet-outline');
  const [editBg, setEditBg] = useState('#DBEAFE');
  const [editIconColor, setEditIconColor] = useState('#2563EB');

  const amountPulse = useSharedValue(1);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id) return;
    if (!opts?.silent) setLoading(true);
    const row = await getAssetById(Number(id));
    const txs = row ? await getTransactions(row.id) : [];
    setAsset(row);
    setTransactions(txs);
    if (!opts?.silent) setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (usdRubRate) setBuyRate(String(usdRubRate));
  }, [usdRubRate]);

  useEffect(() => {
    if (!asset) return;
    amountPulse.value = withSequence(
      withSpring(1.04, { damping: 12, stiffness: 220 }),
      withSpring(1, { damping: 14, stiffness: 180 }),
    );
  }, [asset?.current_amount, amountPulse, asset]);

  const openEdit = useCallback(() => {
    if (!asset) return;
    setEditName(asset.name);
    setEditPurpose(asset.purpose ?? '');
    setEditGoal(asset.goal_amount != null ? String(asset.goal_amount) : '');
    setEditIcon(asset.icon);
    setEditBg(asset.bg_color);
    setEditIconColor(asset.icon_color);
    setEditOpen(true);
  }, [asset]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={openEdit}
          hitSlop={12}
          className="mr-1 h-9 w-9 items-center justify-center rounded-full bg-slate-50"
          accessibilityLabel="Редактировать актив">
          <Ionicons name="pencil" size={18} color="#2563EB" />
        </Pressable>
      ),
    });
  }, [navigation, openEdit]);

  const amountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountPulse.value }],
  }));

  if (loading || !asset) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const providerKey = asset.provider === 'usd' ? 'usd' : 'rub';
  const currencySymbol = ASSET_PROVIDERS[asset.provider].symbol;
  const valuation =
    asset.provider === 'usd' && usdRubRate ? calcUsdValuation(asset, usdRubRate) : null;
  const hasGoal = asset.goal_amount != null && asset.goal_amount > 0;
  const goalProgress = hasGoal
    ? Math.min(asset.current_amount / (asset.goal_amount as number), 1)
    : 0;

  const openModal = (next: TxMode) => {
    setAmount('');
    setMode(next);
  };

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert('Ошибка', 'Укажите сумму больше 0');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'deposit') {
        if (asset.provider === 'usd') {
          const rate = Number(buyRate || usdRubRate || 82);
          await addTransaction(asset.id, value, 'Пополнение', value * rate);
        } else {
          await addTransaction(asset.id, value, 'Пополнение', value);
        }
      } else if (mode === 'withdraw') {
        if (value > asset.current_amount) {
          Alert.alert('Ошибка', 'Нельзя списать больше, чем есть');
          setSaving(false);
          return;
        }
        await addTransaction(asset.id, -value, 'Списание');
      }
      setMode(null);
      await load({ silent: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Ошибка', 'Укажите название');
      return;
    }
    setSaving(true);
    try {
      await updateAsset(asset.id, {
        name: editName.trim(),
        purpose: editPurpose.trim() || null,
        goal_amount: editGoal.trim() ? Number(editGoal) : null,
        icon: editIcon,
        bg_color: editBg,
        icon_color: editIconColor,
      });
      setEditOpen(false);
      await load({ silent: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={[]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <FadeInBlock>
          <View className="mb-5 items-center">
            <AssetAvatar
              icon={asset.icon}
              bgColor={asset.bg_color}
              iconColor={asset.icon_color}
              size={72}
            />
            <Text className="mt-3 text-2xl font-bold text-slate-900">{asset.name}</Text>
            {asset.purpose ? (
              <Text className="mt-1 text-sm text-slate-500">{asset.purpose}</Text>
            ) : null}
          </View>
        </FadeInBlock>

        <FadeInItem index={1}>
          <View className="mb-4 items-center rounded-3xl bg-slate-50 px-5 py-6">
            <Animated.View style={amountStyle}>
              <Text className="text-4xl font-bold text-slate-900">
                {formatMoney(asset.current_amount, providerKey)}
              </Text>
            </Animated.View>
            {valuation ? (
              <>
                <Text className="mt-1 text-base text-slate-500">
                  {formatRub(valuation.currentValueRub)}
                </Text>
                {valuation.profitPercent != null ? (
                  <View className="mt-3">
                    <TrendPill
                      value={`${valuation.profitPercent >= 0 ? '+' : ''}${valuation.profitPercent}%`}
                      positive={valuation.profitRub >= 0}
                    />
                  </View>
                ) : null}
              </>
            ) : null}

            {hasGoal ? (
              <View className="mt-5 w-full">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm text-slate-500">Прогресс цели</Text>
                  <AnimatedPercentLabel progress={goalProgress} />
                </View>
                <AnimatedProgressBar progress={goalProgress} height={10} />
                <Text className="mt-2 text-center text-sm text-slate-600">
                  Накоплено {formatMoney(asset.current_amount, providerKey)} из{' '}
                  {formatMoney(asset.goal_amount as number, providerKey)}
                </Text>
              </View>
            ) : null}
          </View>
        </FadeInItem>

        {valuation ? (
          <FadeInItem index={2}>
            <View className="mb-5 rounded-2xl border border-slate-100 bg-white p-4">
              <Text className="mb-3 text-base font-semibold text-slate-900">Валютная аналитика</Text>
              <Row
                label="Средний курс покупки"
                value={
                  valuation.averageBuyRate != null
                    ? `${valuation.averageBuyRate.toFixed(2)} ₽/$`
                    : '—'
                }
              />
              <Row label="Текущий курс" value={`${usdRubRate} ₽/$`} />
              <Row label="Потрачено" value={formatRub(valuation.costBasisRub)} />
              <Row label="Сейчас стоит" value={formatRub(valuation.currentValueRub)} />
              <Row
                label="Прибыль"
                value={`${valuation.profitRub >= 0 ? '+' : ''}${formatRub(valuation.profitRub)}`}
                highlight={valuation.profitRub >= 0}
              />
            </View>
          </FadeInItem>
        ) : null}

        <FadeInItem index={3}>
          <View className="mb-6 flex-row gap-3">
            <Pressable
              className="flex-1 rounded-2xl bg-blue-600 py-4"
              onPress={() => openModal('deposit')}>
              <Text className="text-center text-base font-semibold text-white">Пополнить</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-2xl bg-slate-100 py-4"
              onPress={() => openModal('withdraw')}>
              <Text className="text-center text-base font-semibold text-slate-800">Списать</Text>
            </Pressable>
          </View>
        </FadeInItem>

        <Text className="mb-3 text-lg font-semibold text-slate-900">История операций</Text>
        {transactions.length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="receipt-outline" size={28} color="#2563EB" />
            </View>
            <Text className="text-center text-base font-semibold text-slate-900">
              Пока пусто
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
              Пополните или спишите сумму — здесь появится история движений по активу
            </Text>
            <Pressable
              className="mt-5 rounded-2xl bg-blue-600 px-5 py-3"
              onPress={() => openModal('deposit')}>
              <Text className="text-sm font-semibold text-white">Пополнить актив</Text>
            </Pressable>
          </View>
        ) : (
          transactions.map((tx, index) => (
            <FadeInItem key={tx.id} index={index}>
              <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                <View>
                  <Text className="text-sm font-medium text-slate-900">
                    {tx.amount_delta >= 0 ? 'Пополнение' : 'Списание'}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {new Date(tx.created_at).toLocaleString('ru-RU')}
                    {tx.note ? ` · ${tx.note}` : ''}
                  </Text>
                </View>
                <Text
                  className={`text-sm font-bold ${tx.amount_delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.amount_delta >= 0 ? '+' : '−'}
                  {formatMoney(Math.abs(tx.amount_delta), providerKey)}
                </Text>
              </View>
            </FadeInItem>
          ))
        )}
      </ScrollView>

      <BottomSheet visible={mode != null} onClose={() => setMode(null)}>
        <Text className="mb-4 text-center text-xl font-bold text-slate-900">
          {mode === 'deposit' ? 'Пополнить' : 'Списать'}
        </Text>
        <Text className="mb-2 text-sm font-medium text-slate-700">
          Сумма <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base"
          placeholder={asset.provider === 'usd' ? 'Сумма в USD' : 'Сумма в ₽'}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />
        {mode === 'deposit' && asset.provider === 'usd' ? (
          <>
            <Text className="mb-2 text-sm font-medium text-slate-700">
              Курс покупки ₽/$ <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base"
              placeholder="Курс покупки ₽/$"
              keyboardType="numeric"
              value={buyRate}
              onChangeText={setBuyRate}
            />
          </>
        ) : null}
        <Pressable
          className={`mb-2 rounded-2xl py-4 ${saving ? 'bg-blue-300' : 'bg-blue-600'}`}
          disabled={saving}
          onPress={handleSubmit}>
          <Text className="text-center font-semibold text-white">Подтвердить</Text>
        </Pressable>
        <Pressable className="py-3" onPress={() => setMode(null)}>
          <Text className="text-center font-medium text-slate-500">Отмена</Text>
        </Pressable>
      </BottomSheet>

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)}>
        <Text className="mb-4 text-center text-xl font-bold text-slate-900">Редактировать</Text>

        <Text className="mb-2 text-sm font-medium text-slate-700">
          Название <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base"
          value={editName}
          onChangeText={setEditName}
        />

        <Text className="mb-2 text-sm font-medium text-slate-700">Назначение</Text>
        <TextInput
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base"
          placeholder="Необязательно"
          value={editPurpose}
          onChangeText={setEditPurpose}
        />

        <Text className="mb-2 text-sm font-medium text-slate-700">Цель накопления</Text>
        <View className="mb-4 flex-row items-center rounded-xl border border-slate-200 bg-slate-50">
          <TextInput
            className="flex-1 px-3 py-3 text-base"
            placeholder="Необязательно"
            keyboardType="numeric"
            value={editGoal}
            onChangeText={setEditGoal}
          />
          <Text className="pr-3 text-base font-semibold text-slate-500">{currencySymbol}</Text>
        </View>

        <AssetStylePicker
          icon={editIcon}
          bgColor={editBg}
          iconColor={editIconColor}
          onIconChange={setEditIcon}
          onBgChange={setEditBg}
          onIconColorChange={setEditIconColor}
        />

        <Pressable
          className={`mb-2 rounded-2xl py-4 ${saving ? 'bg-blue-300' : 'bg-blue-600'}`}
          disabled={saving}
          onPress={handleSaveEdit}>
          <Text className="text-center font-semibold text-white">Сохранить</Text>
        </Pressable>
        <Pressable className="py-3" onPress={() => setEditOpen(false)}>
          <Text className="text-center font-medium text-slate-500">Отмена</Text>
        </Pressable>
      </BottomSheet>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text
        className={`text-sm font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </Text>
    </View>
  );
}
