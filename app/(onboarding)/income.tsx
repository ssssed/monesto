import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoneyFlowStep } from '@/components/money-flow/MoneyFlowStep';
import { replaceAllIncomes } from '@/lib/db/incomes';

export default function OnboardingIncomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <MoneyFlowStep
        mode="income"
        title="Ваши доходы"
        subtitle="Укажите зарплату и другие поступления. Для зарплаты 10/25 включите соответствующий переключатель."
        showOneTimeToggle
        showPrimarySalary
        onSave={replaceAllIncomes}
        onNext={() => router.push('/(onboarding)/expenses')}
      />
    </SafeAreaView>
  );
}
