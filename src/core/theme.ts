export const colors = {
  primary: '#FF5A5F', // Vibrante, tipo Airbnb/Rappi
  primaryLight: '#FF8A8E',
  primaryDark: '#E0484C',
  secondary: '#00A699', // Contraste fresco
  background: '#F7F9FC', // Fondo claro premium
  surface: '#FFFFFF', // Tarjetas y paneles
  text: '#222222', // Texto principal (no negro puro)
  textMuted: '#717171', // Texto secundario
  border: '#EBEBEB',
  error: '#E53935',
  success: '#43A047',
  warning: '#FFB300',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  round: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 20, fontWeight: '600' as const, color: colors.text },
  body1: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
  body2: { fontSize: 14, fontWeight: '400' as const, color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
  button: { fontSize: 16, fontWeight: '600' as const, color: colors.surface },
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2, // Android
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  }
};
