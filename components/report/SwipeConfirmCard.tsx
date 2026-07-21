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
  rejected: boolean;
  swipeable: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

/** Карточка актива: вправо — принять, влево — отклонить. */
export function SwipeConfirmCard({
  title,
  balanceLabel,
  incomingRub,
  icon,
  bgColor,
  iconColor,
  confirmed,
  rejected,
  swipeable,
  onConfirm,
  onReject,
}: Props) {
  const translateX = useSharedValue(0);
  const flash = useSharedValue(0);
  const maxSlide = 88;
  const settled = confirmed || rejected;

  useEffect(() => {
    if (settled) {
      translateX.value = 0;
      flash.value = withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 420 }));
    }
  }, [settled, flash, translateX]);

  const pan = Gesture.Pan()
    .enabled(swipeable && !settled && incomingRub > 0)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.value = Math.max(-maxSlide, Math.min(event.translationX, maxSlide));
    })
    .onEnd(() => {
      if (translateX.value > maxSlide * 0.55) {
        translateX.value = withSpring(0);
        runOnJS(onConfirm)();
      } else if (translateX.value < -maxSlide * 0.55) {
        translateX.value = withSpring(0);
        runOnJS(onReject)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const confirmTrackStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 18, maxSlide], [0, 0.45, 0.9], Extrapolation.CLAMP),
  }));

  const rejectTrackStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-maxSlide, -18, 0], [0.9, 0.45, 0], Extrapolation.CLAMP),
  }));

  const confirmAccentStyle = useAnimatedStyle(() => ({
    width: interpolate(translateX.value, [0, maxSlide], [0, 5], Extrapolation.CLAMP),
    opacity: interpolate(translateX.value, [0, 12], [0, 1], Extrapolation.CLAMP),
  }));

  const rejectAccentStyle = useAnimatedStyle(() => ({
    width: interpolate(translateX.value, [-maxSlide, 0], [5, 0], Extrapolation.CLAMP),
    opacity: interpolate(translateX.value, [-12, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const cardStyle = useAnimatedStyle(() => {
    const progress = translateX.value / maxSlide;
    const absProgress = Math.abs(progress);
    return {
      transform: [
        { translateX: translateX.value },
        { scale: interpolate(absProgress, [0, 1], [1, 0.985], Extrapolation.CLAMP) },
      ],
      borderColor:
        translateX.value >= 0
          ? interpolateColor(
              translateX.value,
              [0, maxSlide * 0.55, maxSlide],
              ['#f1f5f9', '#93c5fd', '#2563eb'],
            )
          : interpolateColor(
              translateX.value,
              [-maxSlide, -maxSlide * 0.55, 0],
              ['#ef4444', '#fca5a5', '#f1f5f9'],
            ),
      backgroundColor:
        translateX.value >= 0
          ? interpolateColor(translateX.value, [0, maxSlide], ['#ffffff', '#eff6ff'])
          : interpolateColor(translateX.value, [-maxSlide, 0], ['#fef2f2', '#ffffff']),
      shadowOpacity: interpolate(absProgress, [0, 1], [0.04, 0.12], Extrapolation.CLAMP),
    };
  });

  const confirmHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 20, maxSlide * 0.55], [0, 0.7, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(translateX.value, [0, maxSlide], [-8, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const rejectHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-maxSlide * 0.55, -20, 0], [1, 0.7, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(translateX.value, [-maxSlide, 0], [0, 8], Extrapolation.CLAMP),
      },
    ],
  }));

  const amountStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          Math.abs(translateX.value),
          [0, maxSlide * 0.55, maxSlide],
          [1, 1.06, 1.1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value * 0.35,
    backgroundColor: confirmed ? '#93c5fd' : '#fca5a5',
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.trackConfirm, confirmTrackStyle]} />
      <Animated.View style={[styles.trackReject, rejectTrackStyle]} />
      <Animated.View style={[styles.accentLeft, confirmAccentStyle]} />
      <Animated.View style={[styles.accentRight, rejectAccentStyle]} />

      <View style={styles.hintSlotLeft} pointerEvents="none">
        <Animated.View style={[styles.hintPill, confirmHintStyle]}>
          <Ionicons name="chevron-forward" size={16} color="#2563EB" />
        </Animated.View>
      </View>
      <View style={styles.hintSlotRight} pointerEvents="none">
        <Animated.View style={[styles.hintPill, rejectHintStyle]}>
          <Ionicons name="chevron-back" size={16} color="#EF4444" />
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
              {incomingRub > 0 && !rejected ? (
                <Animated.View style={amountStyle}>
                  <Text className="mr-1.5 text-sm font-bold text-blue-600">
                    +{formatRub(incomingRub)}
                  </Text>
                </Animated.View>
              ) : rejected ? (
                <Text className="mr-1.5 text-xs text-slate-400">отклонено</Text>
              ) : (
                <Text className="text-xs text-slate-400">—</Text>
              )}
              {confirmed ? <Ionicons name="checkmark-circle" size={22} color="#059669" /> : null}
              {rejected ? <Ionicons name="close-circle" size={22} color="#DC2626" /> : null}
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
  trackConfirm: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
  },
  trackReject: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
  },
  accentLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  accentRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#EF4444',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  hintSlotLeft: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 0,
  },
  hintSlotRight: {
    position: 'absolute',
    right: 10,
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
    borderRadius: 16,
  },
});
