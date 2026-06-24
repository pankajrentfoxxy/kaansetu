import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

// Tappable wrapper: springs down on press + a light haptic tick. Drop-in for TouchableOpacity
// on the things that should feel tactile (cards, primary buttons).
export function Press({
  children,
  onPress,
  style,
  scaleTo = 0.97,
  haptic = true,
  disabled,
  ...rest
}: Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  return (
    <Pressable
      onPressIn={() => { spring(scaleTo); if (haptic && !disabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      onPressOut={() => spring(1)}
      onPress={onPress}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity: disabled ? 0.6 : 1 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
