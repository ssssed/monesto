import { Stack } from 'expo-router';

export default function AssetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { color: '#0f172a', fontWeight: '700' },
        headerShadowVisible: false,
        headerBackTitle: 'Назад',
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'Новый актив' }} />
      <Stack.Screen name="[id]" options={{ title: 'Актив' }} />
    </Stack>
  );
}
