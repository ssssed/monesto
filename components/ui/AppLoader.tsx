import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  message?: string;
}

/** Брендовый лоадер по дизайну Loading Page. */
export function AppLoader({ message = 'Загружаем ваши активы...' }: Props) {
  const orbit = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [dot, setDot] = useState(0);

  useEffect(() => {
    orbit.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(orbit);
      cancelAnimation(pulse);
    };
  }, [orbit, pulse]);

  useEffect(() => {
    const id = setInterval(() => setDot((prev) => (prev + 1) % 3), 420);
    return () => clearInterval(id);
  }, []);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit.value * 360}deg` }, { translateY: -58 }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringPulse = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [1, 1.06], [0.55, 1]),
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.root} testID="app-loader">
      <View style={styles.orbits}>
        <Animated.View style={[styles.ring, styles.ringOuter, ringPulse]} />
        <View style={[styles.ring, styles.ringMid]} />
        <View style={[styles.ring, styles.ringInner]} />

        <Animated.View style={[styles.core, coreStyle]}>
          <Ionicons name="trending-up" size={34} color="#ffffff" />
        </Animated.View>

        <Animated.View style={[styles.satellite, orbitStyle]} />
      </View>

      <Text style={styles.brand}>Monesto</Text>
      <Text style={styles.message}>{message}</Text>

      <View style={styles.dots}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[styles.dot, index === dot ? styles.dotActive : styles.dotIdle]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  orbits: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  ringOuter: {
    width: 148,
    height: 148,
  },
  ringMid: {
    width: 118,
    height: 118,
    opacity: 0.85,
  },
  ringInner: {
    width: 92,
    height: 92,
    opacity: 0.7,
  },
  core: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  satellite: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#2563EB',
  },
  dotIdle: {
    backgroundColor: '#DBEAFE',
  },
});
