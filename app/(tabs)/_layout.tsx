import { Tabs } from "expo-router";

import { GlassTabBar } from "@/components/navigation/GlassTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { color: "#0f172a", fontWeight: "700" },
        headerShadowVisible: false,
        // Контейнер tab bar прозрачный — рисуем свою капсулу.
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: "Активы",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Настройки",
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
