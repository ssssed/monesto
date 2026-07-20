import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { color: '#0f172a', fontWeight: '700' },
        headerShadowVisible: false,
        headerBackTitle: 'Назад',
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="income" options={{ title: 'Доходы' }} />
      <Stack.Screen name="expenses" options={{ title: 'Расходы' }} />
      <Stack.Screen name="rules/index" options={{ title: 'Правила' }} />
      <Stack.Screen name="rules/new" options={{ title: 'Новое правило' }} />
      <Stack.Screen name="rules/[id]" options={{ title: 'Правило' }} />
    </Stack>
  );
}
