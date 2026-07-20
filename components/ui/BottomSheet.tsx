import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

const SPRING = { damping: 28, stiffness: 320, mass: 0.9 };
const CLOSE_MS = 220;

/**
 * Bottom sheet в духе shadcn Drawer:
 * оверлей плавно появляется, панель выезжает снизу со spring.
 */
export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.value = 0;
      progress.value = withSpring(1, SPRING);
    } else if (mounted) {
      progress.value = withTiming(
        0,
        { duration: CLOSE_MS, easing: Easing.out(Easing.cubic) },
        (done) => {
          if (done) runOnJS(setMounted)(false);
        },
      );
    }
  }, [visible, mounted, progress, dragY]);

  const requestClose = () => {
    onClose();
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      dragY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 80 || event.velocityY > 900) {
        dragY.value = withTiming(0, { duration: CLOSE_MS });
        runOnJS(requestClose)();
      } else {
        dragY.value = withSpring(0, SPRING);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.45 * (1 - Math.min(dragY.value / 320, 0.5)),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.value) * 420 + dragY.value,
      },
    ],
  }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }, sheetStyle]}>
          <GestureDetector gesture={pan}>
            <Animated.View style={styles.handleWrap}>
              <View style={styles.handle} />
            </Animated.View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 4,
    maxHeight: '92%',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
  },
});
