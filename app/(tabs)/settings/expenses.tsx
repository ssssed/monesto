import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoneyFlowStep } from '@/components/money-flow/MoneyFlowStep';
import { getAllExpenses, replaceAllExpenses } from '@/lib/db/expenses';
import type { MoneyFlowEntry } from '@/lib/types';
import { expensesToEntries } from '@/lib/utils/format';

export default function SettingsExpensesScreen() {
  const [entries, setEntries] = useState<MoneyFlowEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllExpenses().then((rows) => {
      setEntries(expensesToEntries(rows));
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={[]}>
      <MoneyFlowStep
        mode="expense"
        title="Расходы"
        subtitle="Обновите обязательные расходы."
        initialEntries={entries}
        showOneTimeToggle
        submitLabel="Сохранить"
        onSave={async (payload) => {
          await replaceAllExpenses(payload);
          Alert.alert('Сохранено', 'Расходы обновлены');
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
