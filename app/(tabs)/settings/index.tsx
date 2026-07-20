import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInBlock, FadeInItem } from '@/components/ui/Motion';
import { clearAllData } from '@/lib/db/client';

export default function SettingsScreen() {
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const armConfirm = () => {
    setConfirmClear(true);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmClear(false), 4500);
  };

  const handleClearAll = async () => {
    if (!confirmClear) {
      armConfirm();
      return;
    }

    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmClear(false);
    setClearing(true);
    try {
      await clearAllData();
      router.replace('/(onboarding)/income');
    } finally {
      setClearing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <FadeInBlock>
          <Text className="mb-6 text-3xl font-bold text-slate-900">Настройки</Text>
        </FadeInBlock>

        <FadeInItem index={0}>
          <View className="mb-6">
            <Text className="text-lg font-bold text-slate-900">Авто-распределение</Text>
            <Text className="mb-3 mt-0.5 text-sm text-slate-500">
              Правила для автоматической покупки активов
            </Text>
            <Link href="/(tabs)/settings/rules" asChild>
              <Pressable className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <Text className="text-sm font-medium text-blue-600">Открыть правила →</Text>
              </Pressable>
            </Link>
          </View>
        </FadeInItem>

        <FadeInItem index={1}>
          <View className="mb-6">
            <Text className="text-lg font-bold text-slate-900">Доходы</Text>
            <Text className="mb-3 mt-0.5 text-sm text-slate-500">
              Источники дохода и график выплат
            </Text>
            <Link href="/(tabs)/settings/income" asChild>
              <Pressable className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <Text className="text-sm font-medium text-emerald-600">Редактировать доходы →</Text>
              </Pressable>
            </Link>
          </View>
        </FadeInItem>

        <FadeInItem index={2}>
          <View className="mb-6">
            <Text className="text-lg font-bold text-slate-900">Расходы</Text>
            <Text className="mb-3 mt-0.5 text-sm text-slate-500">
              Обязательные ежемесячные платежи
            </Text>
            <Link href="/(tabs)/settings/expenses" asChild>
              <Pressable className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <Text className="text-sm font-medium text-slate-700">Редактировать расходы →</Text>
              </Pressable>
            </Link>
          </View>
        </FadeInItem>

        <FadeInItem index={3}>
          <View className="mb-8">
            <Text className="mb-1 text-lg font-bold text-slate-900">Опасная зона</Text>
            <Text className="mb-3 text-sm text-slate-500">
              Необратимое удаление всех данных приложения
            </Text>

            <View
              className={`overflow-hidden rounded-2xl border ${
                confirmClear ? 'border-red-500 bg-red-50' : 'border-red-200 bg-white'
              }`}>
              {confirmClear ? (
                <View className="border-b border-red-100 px-4 py-3">
                  <Text className="text-sm font-medium text-red-700">
                    Ещё одно нажатие удалит активы, доходы, расходы и историю
                  </Text>
                </View>
              ) : null}

              <Pressable
                className={`flex-row items-center justify-center px-4 py-4 ${
                  confirmClear ? 'bg-red-500' : 'bg-white'
                }`}
                disabled={clearing}
                onPress={handleClearAll}
                testID="clear-all-data">
                {clearing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons
                      name={confirmClear ? 'warning-outline' : 'trash-outline'}
                      size={20}
                      color={confirmClear ? '#ffffff' : '#ef4444'}
                    />
                    <Text
                      className={`ml-2 text-base font-semibold ${
                        confirmClear ? 'text-white' : 'text-red-500'
                      }`}>
                      {confirmClear ? 'Точно очистить всё' : 'Очистить все данные'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {confirmClear ? (
              <Pressable className="mt-2 py-2" onPress={() => setConfirmClear(false)}>
                <Text className="text-center text-sm font-medium text-slate-500">Отмена</Text>
              </Pressable>
            ) : (
              <Text className="mt-2 text-center text-xs text-slate-400">
                Потребуется повторное подтверждение
              </Text>
            )}
          </View>
        </FadeInItem>

        <View className="items-center pb-4">
          <Text className="text-sm text-slate-400">Monesto v1.0.0</Text>
          <Text className="mt-1 text-sm text-slate-400">@monesto_app</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
