import { useAuth } from '@/core/context/AuthContext';
import { colors, shadows, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
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


  return (
    <ImageBackground 
      source={require('../../../assets/images/plaza_armas.jpg')} 
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.15 }}
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Image 
              source={require('../../../assets/images/logo_esperanza.png')} 
              style={styles.logo}
              contentFit="contain"
            />
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
              <Button title="Ingresar" onPress={handleLogin} style={{ marginTop: spacing.l }} />
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.l,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: spacing.m,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
});

