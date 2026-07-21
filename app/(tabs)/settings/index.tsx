import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInBlock, FadeInItem } from '@/components/ui/Motion';
import { clearAllData } from '@/lib/db/client';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const MENU_ITEMS: {
  href: '/(tabs)/settings/rules' | '/(tabs)/settings/income' | '/(tabs)/settings/expenses';
  title: string;
  subtitle: string;
  icon: IoniconName;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    href: '/(tabs)/settings/rules',
    title: 'Авто-распределение',
    subtitle: 'Правила покупки активов',
    icon: 'git-branch-outline',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
  },
  {
    href: '/(tabs)/settings/income',
    title: 'Доходы',
    subtitle: 'Источники и график выплат',
    icon: 'trending-up-outline',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
  },
  {
    href: '/(tabs)/settings/expenses',
    title: 'Расходы',
    subtitle: 'Ежемесячные платежи',
    icon: 'card-outline',
    iconColor: '#475569',
    iconBg: '#F1F5F9',
  },
];

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
          <Text className="text-3xl font-bold text-slate-900">Настройки</Text>
          <Text className="mb-6 mt-1.5 text-sm leading-5 text-slate-500">
            Доходы, расходы и правила распределения
          </Text>
        </FadeInBlock>

        <FadeInItem index={0}>
          <View className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white">
            {MENU_ITEMS.map((item, index) => (
              <Link key={item.href} href={item.href} asChild>
                <Pressable
                  className={`flex-row items-center px-4 py-4 active:bg-slate-50 ${
                    index < MENU_ITEMS.length - 1 ? 'border-b border-slate-100' : ''
                  }`}>
                  <View
                    className="h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: item.iconBg }}>
                    <Ionicons name={item.icon} size={22} color={item.iconColor} />
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <Text className="text-base font-semibold text-slate-900">{item.title}</Text>
                    <Text className="mt-0.5 text-sm text-slate-500">{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </Pressable>
              </Link>
            ))}
          </View>
        </FadeInItem>

        <FadeInItem index={1}>
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
