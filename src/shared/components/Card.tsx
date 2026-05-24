import React from 'react';
import { StyleSheet, ViewProps, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '@/core/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  noPadding?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, noPadding = false, style, onPress, ...props }) => {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(shadows.soft.elevation);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      elevation: elevation.value,
      // Para Web:
      boxShadow: `0px ${elevation.value}px ${elevation.value * 3}px rgba(0,0,0,0.05)`,
    } as any; // Ignorando el tipado estricto de boxShadow para Reanimated en Web
  });

  const CardWrapper = onPress ? Pressable : Animated.View;
  const cardProps = onPress ? {
    onHoverIn: () => { scale.value = withSpring(1.02); elevation.value = withTiming(shadows.medium.elevation); },
    onHoverOut: () => { scale.value = withSpring(1); elevation.value = withTiming(shadows.soft.elevation); },
    onPressIn: () => { scale.value = withSpring(0.98); },
    onPressOut: () => { scale.value = withSpring(1.02); },
    onPress: onPress,
  } : {};

  return (
    <CardWrapper 
      style={[styles.container, !noPadding && styles.padding, style, animatedStyle]} 
      {...cardProps}
      {...(props as any)}
    >
      {children}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl, // Esquinas más amplias
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  padding: {
    padding: spacing.l,
  }
});
