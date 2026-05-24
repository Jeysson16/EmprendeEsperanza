import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography } from '@/core/theme';

interface TypographyProps extends TextProps {
  variant?: keyof typeof typography;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Typography: React.FC<TypographyProps> = ({ 
  variant = 'body1', 
  color,
  align,
  style, 
  children, 
  ...props 
}) => {
  return (
    <Text 
      style={[
        typography[variant], 
        color && { color },
        align && { textAlign: align },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};
