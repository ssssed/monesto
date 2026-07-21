import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SPRING = { damping: 16, stiffness: 200, mass: 0.75 };
const BAR_HEIGHT = 62;
const H_MARGIN = 18;
const PILL_INSET = 4;

type TabMeta = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TAB_META: Record<string, TabMeta> = {
  index: { label: "Главная", icon: "grid-outline" },
  assets: { label: "Активы", icon: "wallet-outline" },
  settings: { label: "Настройки", icon: "settings-outline" },
};

/** Плавающая glass-капсула вместо системного tab bar. */
export function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);

  const routes = state.routes.filter((route) => route.name in TAB_META);
  const activeRouteName = state.routes[state.index]?.name;
  const activeIndex = Math.max(
    0,
    routes.findIndex((route) => route.name === activeRouteName),
  );

  const progress = useSharedValue(activeIndex);

  useEffect(() => {
    progress.value = withSpring(activeIndex, SPRING);
  }, [activeIndex, progress]);

  const pillWidth =
    trackWidth > 0
      ? (trackWidth - PILL_INSET * 2) / Math.max(routes.length, 1)
      : 0;

  const pillStyle = useAnimatedStyle(() => ({
    width: pillWidth,
    transform: [{ translateX: PILL_INSET + progress.value * pillWidth }],
  }));

  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          height: BAR_HEIGHT + bottomPad + 10,
          paddingBottom: bottomPad,
        },
      ]}
    >
      <View style={styles.shadowWrap}>
        <View
          style={styles.capsule}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        >
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={70}
              tint="light"
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.androidFill]} />
          )}
          <View style={styles.tint} pointerEvents="none" />

          {pillWidth > 0 ? (
            <Animated.View style={[styles.pill, pillStyle]} />
          ) : null}

          <View style={styles.row}>
            {routes.map((route, index) => {
              const focused = index === activeIndex;
              const meta = TAB_META[route.name]!;
              const { options } = descriptors[route.key];

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  accessibilityLabel={
                    options.tabBarAccessibilityLabel ?? meta.label
                  }
                  onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name, route.params);
                    }
                  }}
                  onLongPress={() =>
                    navigation.emit({ type: "tabLongPress", target: route.key })
                  }
                  style={styles.item}
                >
                  <Ionicons
                    name={meta.icon}
                    size={20}
                    color={focused ? "#FFFFFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.label,
                      focused ? styles.labelActive : styles.labelIdle,
                    ]}
                    numberOfLines={1}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

/** Отступ контента над плавающим tab bar. */
export const GLASS_TAB_BAR_CONTENT_INSET = 110;

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_MARGIN,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  shadowWrap: {
    borderRadius: BAR_HEIGHT / 2,
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  capsule: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  androidFill: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248, 250, 252, 0.35)",
  },
  pill: {
    position: "absolute",
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: 0,
    borderRadius: 999,
    backgroundColor: "#0f172a",
  },
  row: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    zIndex: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  labelActive: {
    color: "#FFFFFF",
  },
  labelIdle: {
    color: "#64748B",
  },
});
