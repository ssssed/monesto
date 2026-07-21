import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SPRING = { damping: 20, stiffness: 140, mass: 0.8 };

function useCountTo(progress: number, duration = 520) {
  const target = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  const [pct, setPct] = useState(target);
  const pctRef = useRef(pct);
  pctRef.current = pct;

  useEffect(() => {
    const start = pctRef.current;
    const delta = target - start;
    if (delta === 0) {
      setPct(target);
      return;
    }

    const steps = Math.max(1, Math.min(Math.abs(delta), 28));
    const stepMs = duration / steps;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setPct(i >= steps ? target : Math.round(start + (delta * i) / steps));
      if (i >= steps) clearInterval(id);
    }, stepMs);

    return () => clearInterval(id);
  }, [duration, target]);

  return pct;
}

interface BarProps {
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
}

/** Горизонтальный прогресс с плавным заполнением / уменьшением. */
export function AnimatedProgressBar({
  progress,
  height = 10,
  trackColor = '#E2E8F0',
  fillColor = '#2563EB',
}: BarProps) {
  const value = useSharedValue(0);
  const trackWidth = useSharedValue(0);

  useEffect(() => {
    const next = Math.min(Math.max(progress, 0), 1);
    value.value = withSpring(next, SPRING);
    return () => {
      cancelAnimation(value);
    };
  }, [progress, value]);

  const onLayout = (event: LayoutChangeEvent) => {
    trackWidth.value = event.nativeEvent.layout.width;
  };

  const fillStyle = useAnimatedStyle(() => ({
    width: value.value * trackWidth.value,
  }));

  return (
    <View
      onLayout={onLayout}
      style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height }]}>
      <Animated.View
        style={[
          styles.fill,
          { height, backgroundColor: fillColor, borderRadius: height },
          fillStyle,
        ]}
      />
    </View>
  );
}

interface RingBadgeProps {
  current: number;
  goal: number;
}

/**
 * Компактное кольцо цели (~16px) + % справа.
 */
export function AnimatedGoalBadge({ current, goal }: RingBadgeProps) {
  const progress = goal > 0 ? Math.min(Math.max(current / goal, 0), 1) : 0;
  const pct = useCountTo(progress);
  const size = 16;
  const border = 2;

  return (
    <View style={styles.badgeRow}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: border,
            borderColor: '#E2E8F0',
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: border,
            borderColor: 'transparent',
            borderTopColor: progress > 0.02 ? '#2563EB' : 'transparent',
            borderRightColor: progress > 0.25 ? '#2563EB' : 'transparent',
            borderBottomColor: progress > 0.5 ? '#2563EB' : 'transparent',
            borderLeftColor: progress > 0.75 ? '#2563EB' : 'transparent',
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </View>
      <Text style={styles.badgePct}>{pct}%</Text>
    </View>
  );
}

/** Alias на случай старых импортов. */
export const GoalProgressBadge = AnimatedGoalBadge;

export function AnimatedPercentLabel({ progress }: { progress: number }) {
  const pct = useCountTo(progress);
  return <Text style={styles.percentLabel}>{pct}%</Text>;
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePct: {
    marginLeft: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  percentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
});
