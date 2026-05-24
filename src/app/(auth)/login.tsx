import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing, shadows } from '@/core/theme';
import { useAuth } from '@/core/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      // El redireccionamiento automático se maneja en _layout.tsx
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo es inválido.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle('cliente'); // Se registra como cliente por defecto al usar Google rápido
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Typography variant="h2" color={colors.primary}>Bienvenido de vuelta</Typography>
          <Typography variant="body1" style={{ marginTop: spacing.xs, color: colors.textMuted }}>
            Ingresa a tu cuenta para continuar
          </Typography>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Typography variant="body2" color={colors.error} style={{ marginLeft: spacing.xs, flex: 1 }}>
                {error}
              </Typography>
            </View>
          )}

          <Input 
            label="Correo Electrónico" 
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <Input 
            label="Contraseña" 
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.l }} />
          ) : (
            <>
              <Button title="Ingresar" onPress={handleLogin} style={{ marginTop: spacing.l }} />
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Typography variant="body2" color={colors.textMuted} style={styles.dividerText}>O continúa con</Typography>
                <View style={styles.divider} />
              </View>

              <Button 
                title="Iniciar sesión con Google" 
                variant="outline" 
                onPress={handleGoogleLogin}
                style={styles.googleBtn}
              >
                <View style={styles.googleBtnContent}>
                  <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: spacing.s }} />
                  <Typography variant="body1" style={{ fontWeight: '600' }}>Google</Typography>
                </View>
              </Button>
            </>
          )}
          
          <Button 
            title="¿No tienes cuenta? Regístrate" 
            variant="ghost" 
            onPress={() => router.push('/(auth)/register')}
            style={{ marginTop: spacing.m }}
            disabled={loading}
          />
          <Button 
            title="Volver al inicio" 
            variant="ghost" 
            onPress={() => router.replace('/')}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.l,
  },
  header: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 16,
    ...shadows.medium,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.m,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.l,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.m,
  },
  googleBtn: {
    borderColor: '#DFE1E5',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

