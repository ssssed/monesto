import { useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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

const OPEN_SPRING = { damping: 26, stiffness: 280, mass: 0.85 };
const CLOSE_MS = 280;
/** Достаточно большое смещение, чтобы лист полностью уехал за экран до unmount. */
const HIDDEN_Y = 720;

/**
 * Bottom sheet: spring при открытии, плавный timing при закрытии.
 * Клавиатура поднимает панель; unmount только после полной анимации.
 */
export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);
  const closing = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      closing.value = 0;
      setMounted(true);
      dragY.value = 0;
      const frame = requestAnimationFrame(() => {
        progress.value = withSpring(1, OPEN_SPRING);
      });
      return () => cancelAnimationFrame(frame);
    }

    if (!mounted) return;

    closing.value = 1;
    Keyboard.dismiss();
    keyboardHeight.value = withTiming(0, {
      duration: CLOSE_MS,
      easing: Easing.out(Easing.cubic),
    });
    dragY.value = withTiming(0, { duration: CLOSE_MS });
    progress.value = withTiming(
      0,
      { duration: CLOSE_MS, easing: Easing.bezier(0.32, 0.72, 0, 1) },
      (finished) => {
        if (finished) {
          closing.value = 0;
          runOnJS(setMounted)(false);
        }
      },
    );
    // Только `visible`: повторный запуск при смене mounted ломал закрытие.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      if (closing.value) return;
      keyboardHeight.value = withTiming(event.endCoordinates.height, {
        duration: Platform.OS === 'ios' ? event.duration || 250 : 180,
        easing: Easing.out(Easing.cubic),
      });
    });
    const onHide = Keyboard.addListener(hideEvent, (event) => {
      if (closing.value) return;
      keyboardHeight.value = withTiming(0, {
        duration: Platform.OS === 'ios' ? event.duration || 220 : 160,
        easing: Easing.out(Easing.cubic),
      });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardHeight, closing]);

  const requestClose = () => {
    Keyboard.dismiss();
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
        dragY.value = withSpring(0, OPEN_SPRING);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.45 * (1 - Math.min(dragY.value / 320, 0.5)),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.value) * HIDDEN_Y + dragY.value - keyboardHeight.value,
      },
    ],
    opacity: progress.value < 0.02 ? 0 : 1,
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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
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
  content: {
    paddingBottom: 8,
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
