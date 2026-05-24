import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

// Definición de colores ultra-premium
export const colors = {
  primary: '#FF4500', // Naranja vibrante profundo
  primaryLight: '#FF7043',
  primaryDark: '#D84315',
  secondary: '#2E1E5B', // Morado oscuro elegante para contraste
  background: '#F9FAFB', // Gris ultra claro (casi blanco)
  surface: '#FFFFFF', // Blanco puro para tarjetas
  text: '#111827', // Casi negro para legibilidad
  textMuted: '#6B7280', // Gris medio
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  round: 9999,
};

export const typography = {
  h1: { fontSize: 36, fontWeight: '800' as const, color: colors.text, letterSpacing: -1 },
  h2: { fontSize: 28, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '600' as const, color: colors.text },
  body1: { fontSize: 16, fontWeight: '400' as const, color: colors.text, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  button: { fontSize: 16, fontWeight: '600' as const, color: colors.surface },
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2, // Android
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  floating: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  }
};

// Utilidades Responsive para Web (Desktop)
export const layout = {
  isWebDesktop: Platform.OS === 'web' && width > 768,
  maxWidth: 1024,
  getContainerStyle: () => ({
    flex: 1,
    alignSelf: 'center' as const,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1024 : '100%',
  })
};
