import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoneyFlowStep } from '@/components/money-flow/MoneyFlowStep';
import { getAllIncomes, replaceAllIncomes } from '@/lib/db/incomes';
import type { MoneyFlowEntry } from '@/lib/types';
import { incomesToEntries } from '@/lib/utils/format';

export default function SettingsIncomeScreen() {
  const [entries, setEntries] = useState<MoneyFlowEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllIncomes().then((rows) => {
      setEntries(incomesToEntries(rows));
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={[]}>
      <MoneyFlowStep
        mode="income"
        title="Доходы"
        subtitle="Обновите зарплату и другие источники дохода."
        initialEntries={entries}
        showOneTimeToggle
        showPrimarySalary
        submitLabel="Сохранить"
        onSave={async (payload) => {
          await replaceAllIncomes(payload);
          Alert.alert('Сохранено', 'Доходы обновлены');
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
