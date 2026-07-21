import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SWIPE_MAX = 88;
const SWIPE_TRIGGER = SWIPE_MAX * 0.55;

interface Props {
  children: ReactNode;
  onDelete: () => void;
  enabled?: boolean;
  borderRadius?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** Свайп влево → удаление. Стиль как у доходов/расходов. */
export function SwipeToDelete({
  children,
  onDelete,
  enabled = true,
  borderRadius = 24,
  borderColor = "#f1f5f9",
  style,
}: Props) {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-14, 14])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      translateX.value = Math.max(-SWIPE_MAX, Math.min(0, event.translationX));
    })
    .onEnd(() => {
      if (translateX.value < -SWIPE_TRIGGER) {
        translateX.value = withTiming(
          -SWIPE_MAX,
          { duration: 120 },
          (finished) => {
            if (finished) runOnJS(onDelete)();
          },
        );
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteTrackStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_MAX, -12, 0],
      [1, 0.55, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const deleteIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_MAX, -28, 0],
      [1, 0.4, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [-SWIPE_MAX, 0],
          [1, 0.85],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={[styles.clip, { borderRadius }, style]}>
      <Animated.View style={[styles.deleteTrack, deleteTrackStyle]}>
        <Animated.View style={deleteIconStyle}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </Animated.View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.card, cardStyle, { borderRadius, borderColor }]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  deleteTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EF4444",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 22,
  },
  card: {
    borderWidth: 1,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
});
