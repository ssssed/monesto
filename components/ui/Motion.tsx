import { type ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';

interface Props {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/** Появление карточек — только при первом mount экрана. */
export function FadeInItem({ children, index = 0, style }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 12) * 55)
        .duration(420)
        .easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(160)}
      style={style}>
      {children}
    </Animated.View>
  );
}

export function FadeInBlock({ children, style }: Omit<Props, 'index'>) {
  return (
    <Animated.View
      entering={FadeInUp.duration(460).easing(Easing.out(Easing.cubic))}
      style={style}>
      {children}
    </Animated.View>
  );
}

export function FadeInScreen({ children, style }: Omit<Props, 'index'>) {
  return (
    <Animated.View entering={FadeIn.duration(280)} style={[{ flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
}

export function PopIn({ children, style }: Omit<Props, 'index'>) {
  return (
    <Animated.View entering={ZoomIn.springify().damping(14).stiffness(180)} style={style}>
      {children}
    </Animated.View>
  );
}
