import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing, shadows } from '@/core/theme';
import { useAuth } from '@/core/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cliente' | 'emprendedor'>('cliente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register(email, password, nombre, role);
      // El redireccionamiento automático se maneja en _layout.tsx
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo es inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil.');
      } else {
        setError('Error al registrarse. Inténtalo de nuevo.');
      }
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
          <Typography variant="h2" color={colors.primary}>Registra tu cuenta</Typography>
          <Typography variant="body1" style={{ marginTop: spacing.xs, color: colors.textMuted }}>
            Crea tu usuario para empezar en EmprendeEsperanza
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

          {/* Selector de Rol Premium */}
          <Typography variant="body2" style={styles.label}>¿Quién eres?</Typography>
          <View style={styles.roleContainer}>
            <Pressable 
              style={[styles.roleOption, role === 'cliente' && styles.roleActive]}
              onPress={() => setRole('cliente')}
              disabled={loading}
            >
              <Ionicons name="people" size={18} color={role === 'cliente' ? '#fff' : colors.textMuted} />
              <Typography 
                variant="body2" 
                style={[styles.roleText, role === 'cliente' && { color: '#fff', fontWeight: 'bold' }]}
              >
                Soy Cliente
              </Typography>
            </Pressable>
            
            <Pressable 
              style={[styles.roleOption, role === 'emprendedor' && styles.roleActive]}
              onPress={() => setRole('emprendedor')}
              disabled={loading}
            >
              <Ionicons name="storefront" size={18} color={role === 'emprendedor' ? '#fff' : colors.textMuted} />
              <Typography 
                variant="body2" 
                style={[styles.roleText, role === 'emprendedor' && { color: '#fff', fontWeight: 'bold' }]}
              >
                Soy Emprendedor
              </Typography>
            </Pressable>
          </View>

          <Input 
            label="Nombre Completo" 
            placeholder="Ej. Juan Pérez"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            editable={!loading}
          />
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
            label="Contraseña (mín. 6 caracteres)" 
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.l }} />
          ) : (
            <Button title="Registrarse" onPress={handleRegister} style={{ marginTop: spacing.l }} />
          )}
          
          <Button 
            title="¿Ya tienes cuenta? Inicia sesión" 
            variant="ghost" 
            onPress={() => router.push('/(auth)/login')}
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
    paddingTop: 50,
    paddingBottom: 50,
  },
  header: {
    marginBottom: spacing.xl,
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
  label: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 4,
    marginBottom: spacing.m,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s,
    borderRadius: 8,
  },
  roleActive: {
    backgroundColor: colors.primary,
    ...shadows.soft,
  },
  roleText: {
    marginLeft: spacing.xs,
    color: colors.text,
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

