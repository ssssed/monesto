import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="income" options={{ title: 'Доходы' }} />
      <Stack.Screen name="expenses" options={{ title: 'Расходы' }} />
    </Stack>
  );
}
