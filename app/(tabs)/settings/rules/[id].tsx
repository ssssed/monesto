import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RuleForm } from '@/components/rules/RuleForm';
import { deleteRule, getRuleById, updateRule } from '@/lib/db/rules';
import type { DistributionRule } from '@/lib/types';

export default function EditRuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rule, setRule] = useState<DistributionRule | null>(null);

  useEffect(() => {
    if (id) getRuleById(Number(id)).then(setRule);
  }, [id]);

  if (!rule) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={[]}>
      <RuleForm
        initial={rule}
        onSubmit={async (payload) => {
          await updateRule(rule.id, payload);
          Alert.alert('Сохранено', 'Правило обновлено');
          router.back();
        }}
        onDelete={async () => {
          await deleteRule(rule.id);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
