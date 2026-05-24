import React from 'react';
import { Text, StyleSheet, ActivityIndicator, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '@/core/theme';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  variant = 'primary', 
  isLoading = false, 
  style, 
  disabled, 
  ...props 
}) => {
  const scale = useSharedValue(1);

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary': return styles.secondary;
      case 'outline': return styles.outline;
      case 'ghost': return styles.ghost;
      default: return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
      case 'ghost': return { color: colors.primary };
      case 'secondary': return { color: colors.surface };
      default: return { color: colors.surface };
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable 
        style={({ pressed, hovered }) => [
          styles.container, 
          getContainerStyle(), 
          (disabled || isLoading) && styles.disabled,
          hovered && variant === 'primary' && styles.hovered,
          pressed && { opacity: 0.8 }
        ]} 
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={getTextStyle().color} />
        ) : (
          <Text style={[typography.button, getTextStyle()]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl, // Más padding para look premium
    borderRadius: radius.round, // Botones más redondeados
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  hovered: {
    backgroundColor: colors.primaryDark,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  }
});
