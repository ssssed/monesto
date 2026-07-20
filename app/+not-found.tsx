import { Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-8 h-36 w-36 items-center justify-center">
            <View className="absolute h-36 w-36 rounded-full border border-blue-100" />
            <View className="absolute h-28 w-28 rounded-full border border-blue-100" />
            <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
              <Ionicons name="search-outline" size={32} color="#2563EB" />
            </View>
          </View>

          <Text className="text-5xl font-bold text-blue-600">404</Text>
          <Text className="mt-3 text-center text-2xl font-bold text-slate-900">
            Страница не найдена
          </Text>
          <Text className="mt-3 text-center text-sm leading-5 text-slate-500">
            Такой страницы не существует. Проверьте ссылку или вернитесь на главную.
          </Text>

          <Link href="/(tabs)" asChild>
            <Pressable className="mt-10 w-full rounded-2xl bg-slate-900 py-4">
              <Text className="text-center text-base font-semibold text-white">На главную</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
