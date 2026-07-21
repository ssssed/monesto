import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssetStylePicker } from '@/components/assets/AssetStylePicker';
import { FormScrollView, FormTextInput } from '@/components/ui/FormScrollView';
import { SelectField } from '@/components/ui/SelectField';
import { createAsset } from '@/lib/db/assets';
import { ASSET_PROVIDERS, getEnabledProviders } from '@/lib/providers/assetProviders';
import type { AssetProvider } from '@/lib/types';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

const PROVIDER_LABELS: Record<AssetProvider, string> = {
  rub: '₽ Рубли',
  usd: 'USD Доллар',
  gold: 'Золото',
  steam: 'Steam',
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text className="mb-2 text-sm font-medium text-slate-700">
      {label}
      {required ? <Text className="text-red-500"> *</Text> : null}
    </Text>
  );
}

export default function NewAssetScreen() {
  const usdRubRate = useExchangeRateStore((state) => state.usdRubRate) ?? 82;
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [goal, setGoal] = useState('');
  const [amount, setAmount] = useState('');
  const [buyRate, setBuyRate] = useState(String(usdRubRate));
  const [provider, setProvider] = useState<AssetProvider>('rub');
  const [icon, setIcon] = useState('wallet-outline');
  const [bgColor, setBgColor] = useState('#DBEAFE');
  const [iconColor, setIconColor] = useState('#2563EB');
  const [saving, setSaving] = useState(false);

  const providers = getEnabledProviders();
  const currencySymbol = ASSET_PROVIDERS[provider].symbol;
  const currentAmount = Number(amount || 0);
  const showBuyRate = provider === 'usd' && currentAmount > 0;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Укажите название актива');
      return;
    }

    let costBasis = currentAmount;
    if (provider === 'usd') {
      if (currentAmount > 0) {
        const rate = Number(buyRate || usdRubRate);
        if (!rate) {
          Alert.alert('Ошибка', 'Укажите курс покупки');
          return;
        }
        costBasis = currentAmount * rate;
      } else {
        costBasis = 0;
      }
    }

    setSaving(true);
    try {
      const id = await createAsset({
        name: name.trim(),
        provider,
        purpose: purpose.trim() || undefined,
        goal_amount: goal ? Number(goal) : undefined,
        current_amount: currentAmount,
        icon,
        bg_color: bgColor,
        icon_color: iconColor,
        cost_basis_rub: costBasis,
      });
      router.replace(`/(tabs)/assets/${id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={[]}>
      <FormScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        <FieldLabel label="Название" required />
        <FormTextInput
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base"
          placeholder="Например, Подушка безопасности"
          value={name}
          onChangeText={setName}
        />

        <FieldLabel label="Назначение" />
        <FormTextInput
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base"
          placeholder="Необязательно"
          value={purpose}
          onChangeText={setPurpose}
        />

        <SelectField
          label="Провайдер"
          required
          value={provider}
          options={providers.map((item) => ({
            value: item,
            label: PROVIDER_LABELS[item],
          }))}
          onChange={setProvider}
          testID="asset-provider-select"
        />

        <FieldLabel label="Цель накопления" />
        <View className="mb-4 flex-row items-center rounded-xl border border-slate-200 bg-slate-50">
          <FormTextInput
            className="flex-1 px-3 py-3 text-base"
            placeholder="Необязательно"
            keyboardType="numeric"
            value={goal}
            onChangeText={setGoal}
          />
          <Text className="pr-3 text-base font-semibold text-slate-500">{currencySymbol}</Text>
        </View>

        <FieldLabel label={provider === 'usd' ? 'Текущая сумма, USD' : 'Текущая сумма, ₽'} />
        <FormTextInput
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base"
          placeholder="0"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {showBuyRate ? (
          <>
            <FieldLabel label="Курс покупки, ₽/$" required />
            <FormTextInput
              className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base"
              placeholder={`Сейчас ${usdRubRate}`}
              keyboardType="numeric"
              value={buyRate}
              onChangeText={setBuyRate}
            />
          </>
        ) : null}

        <AssetStylePicker
          icon={icon}
          bgColor={bgColor}
          iconColor={iconColor}
          onIconChange={setIcon}
          onBgChange={setBgColor}
          onIconColorChange={setIconColor}
        />

        <Pressable
          className={`mt-2 rounded-2xl px-4 py-4 ${saving ? 'bg-blue-300' : 'bg-blue-600'}`}
          disabled={saving}
          onPress={handleSave}>
          <Text className="text-center font-semibold text-white">Создать</Text>
        </Pressable>
        <Pressable className="mt-3 py-3" onPress={() => router.back()}>
          <Text className="text-center font-medium text-slate-500">Отмена</Text>
        </Pressable>
      </FormScrollView>
    </SafeAreaView>
  );
}
