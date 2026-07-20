import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppLoader } from '@/components/ui/AppLoader';
import { useExchangeRateStore } from '@/stores/exchange-rate-store';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const BOOT_MIN_MS = 1100;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [bootDone, setBootDone] = useState(false);
  const fetchRates = useExchangeRateStore((state) => state.fetchRates);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    if (!loaded) return;

    const started = Date.now();
    SplashScreen.hideAsync();

    const timer = setTimeout(() => {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, BOOT_MIN_MS - elapsed);
      setTimeout(() => setBootDone(true), wait);
    }, 0);

    return () => clearTimeout(timer);
  }, [loaded]);

  if (!loaded || !bootDone) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppLoader />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
