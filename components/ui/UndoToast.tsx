import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  message: string;
  durationMs: number;
  onUndo: () => void;
  onDismiss: () => void;
}

/** Компактный toast с отменой действия. */
export function UndoToast({
  visible,
  message,
  durationMs,
  onUndo,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(1);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (!visible || trackWidth <= 0) {
      progress.value = 1;
      return;
    }
    progress.value = 1;
    progress.value = withTiming(0, {
      duration: durationMs,
      easing: Easing.linear,
    });
  }, [visible, durationMs, progress, message, trackWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: trackWidth * progress.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutUp.duration(200)}
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: Math.max(insets.top, 12) + 8,
        zIndex: 50,
      }}
    >
      <View
        className="overflow-hidden rounded-2xl bg-slate-900"
        style={{
          shadowColor: "#0f172a",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <View className="flex-row items-center px-3.5 py-3">
          <View className="mr-2.5 h-8 w-8 items-center justify-center rounded-full bg-slate-800">
            <Ionicons name="trash-outline" size={15} color="#94A3B8" />
          </View>

          <Text
            className="mr-2 min-w-0 flex-1 text-sm font-medium text-white"
            numberOfLines={1}
          >
            {message}
          </Text>

          <Pressable
            onPress={onUndo}
            hitSlop={8}
            className="mr-1 rounded-xl bg-blue-600 px-3 py-1.5 active:bg-blue-500"
          >
            <Text className="text-xs font-bold text-white">Отменить</Text>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            hitSlop={10}
            className="p-1 active:opacity-60"
          >
            <Ionicons name="close" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        <View
          className="h-0.5 bg-slate-800"
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[{ height: "100%", backgroundColor: "#3B82F6" }, barStyle]}
          />
        </View>
      </View>
    </Animated.View>
  );
}
