import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AssetAvatar } from '@/components/assets/AssetAvatar';
import { formatRub } from '@/lib/utils/format';

interface Props {
  title: string;
  balanceLabel: string;
  incomingRub: number;
  icon: string;
  bgColor: string;
  iconColor: string;
  confirmed: boolean;
  swipeable: boolean;
  onConfirm: () => void;
}

/** Карточка актива: свайп вправо подтверждает пополнение. */
export function SwipeConfirmCard({
  title,
  balanceLabel,
  incomingRub,
  icon,
  bgColor,
  iconColor,
  confirmed,
  swipeable,
  onConfirm,
}: Props) {
  const translateX = useSharedValue(0);
  const flash = useSharedValue(0);
  const maxSlide = 88;

  useEffect(() => {
    if (confirmed) {
      translateX.value = 0;
      flash.value = withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 420 }));
    }
  }, [confirmed, flash, translateX]);

  const pan = Gesture.Pan()
    .enabled(swipeable && !confirmed && incomingRub > 0)
    .activeOffsetX(12)
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.value = Math.max(0, Math.min(event.translationX, maxSlide));
    })
    .onEnd(() => {
      if (translateX.value > maxSlide * 0.55) {
        translateX.value = withSpring(0);
        runOnJS(onConfirm)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const trackStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 18, maxSlide], [0, 0.45, 0.9], Extrapolation.CLAMP),
  }));

  const accentStyle = useAnimatedStyle(() => ({
    width: interpolate(translateX.value, [0, maxSlide], [0, 5], Extrapolation.CLAMP),
    opacity: interpolate(translateX.value, [0, 12], [0, 1], Extrapolation.CLAMP),
  }));

  const cardStyle = useAnimatedStyle(() => {
    const progress = translateX.value / maxSlide;
    return {
      transform: [
        { translateX: translateX.value },
        { scale: interpolate(progress, [0, 1], [1, 0.985], Extrapolation.CLAMP) },
      ],
      borderColor: interpolateColor(
        translateX.value,
        [0, maxSlide * 0.55, maxSlide],
        ['#f1f5f9', '#93c5fd', '#2563eb'],
      ),
      backgroundColor: interpolateColor(
        translateX.value,
        [0, maxSlide],
        ['#ffffff', '#eff6ff'],
      ),
      shadowOpacity: interpolate(progress, [0, 1], [0.04, 0.12], Extrapolation.CLAMP),
    };
  });

  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 20, maxSlide * 0.55], [0, 0.7, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(translateX.value, [0, maxSlide], [-8, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const amountStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(translateX.value, [0, maxSlide * 0.55, maxSlide], [1, 1.06, 1.1], Extrapolation.CLAMP),
      },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value * 0.35,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.track, trackStyle]} />
      <Animated.View style={[styles.accent, accentStyle]} />
      <View style={styles.hintSlot} pointerEvents="none">
        <Animated.View style={[styles.hintPill, hintStyle]}>
          <Ionicons name="chevron-forward" size={16} color="#2563EB" />
        </Animated.View>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.flash, flashStyle]} />
          <View className="flex-row items-center px-3 py-3.5">
            <AssetAvatar icon={icon} bgColor={bgColor} iconColor={iconColor} size={48} />
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                {title}
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500" numberOfLines={1}>
                {balanceLabel}
              </Text>
            </View>
            <View className="ml-2 flex-row items-center">
              {incomingRub > 0 ? (
                <Animated.View style={amountStyle}>
                  <Text className="mr-1.5 text-sm font-bold text-blue-600">
                    +{formatRub(incomingRub)}
                  </Text>
                </Animated.View>
              ) : (
                <Text className="text-xs text-slate-400">—</Text>
              )}
              {confirmed ? <Ionicons name="checkmark-circle" size={22} color="#059669" /> : null}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  hintSlot: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 0,
  },
  hintPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  flash: {
    backgroundColor: '#93c5fd',
    borderRadius: 16,
  },
});
