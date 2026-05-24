import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '@/core/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, noPadding = false, style, ...props }) => {
  return (
    <View style={[styles.container, !noPadding && styles.padding, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    ...shadows.soft,
  },
  padding: {
    padding: spacing.m,
  }
});
