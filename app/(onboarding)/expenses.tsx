import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoneyFlowStep } from '@/components/money-flow/MoneyFlowStep';
import { completeOnboarding } from '@/lib/db/client';
import { replaceAllExpenses } from '@/lib/db/expenses';

export default function OnboardingExpensesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <MoneyFlowStep
        mode="expense"
        title="Обязательные расходы"
        subtitle="Добавьте регулярные платежи, которые нужно учитывать до следующей зарплаты."
        showOneTimeToggle
        onSave={async (entries) => {
          await replaceAllExpenses(entries);
          await completeOnboarding();
        }}
        onNext={() => router.replace('/(tabs)')}
      />
    </SafeAreaView>
  );
}
