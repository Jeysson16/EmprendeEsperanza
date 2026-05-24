import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing, shadows } from '@/core/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Redirigir al perfil del negocio para demo
    router.replace('/negocio/1');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Typography variant="h2" color={colors.primary}>Bienvenido de vuelta</Typography>
          <Typography variant="body1" style={{ marginTop: spacing.xs }}>
            Ingresa para gestionar tu comercio
          </Typography>
        </View>

        <View style={styles.form}>
          <Input 
            label="Correo Electrónico" 
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input 
            label="Contraseña" 
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button title="Ingresar" onPress={handleLogin} style={{ marginTop: spacing.l }} />
          
          <Button 
            title="¿No tienes cuenta? Regístrate" 
            variant="ghost" 
            onPress={() => router.push('/(auth)/register')}
            style={{ marginTop: spacing.s }}
          />
          <Button 
            title="Volver" 
            variant="ghost" 
            onPress={() => router.back()}
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
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 16,
    ...shadows.medium,
  }
});
