import { router } from 'expo-router';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RuleForm } from '@/components/rules/RuleForm';
import { createRule } from '@/lib/db/rules';

export default function NewRuleScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={[]}>
      <RuleForm
        onSubmit={async (rule) => {
          await createRule(rule);
          Alert.alert('Сохранено', 'Правило создано');
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
