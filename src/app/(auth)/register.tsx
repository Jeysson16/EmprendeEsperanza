import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing, shadows } from '@/core/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    router.replace('/negocio/1');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Typography variant="h2" color={colors.primary}>Registra tu comercio</Typography>
          <Typography variant="body1" style={{ marginTop: spacing.xs }}>
            Únete a la red de emprendedores
          </Typography>
        </View>

        <View style={styles.form}>
          <Input 
            label="Nombre del Negocio" 
            placeholder="Mi tiendita"
            value={name}
            onChangeText={setName}
          />
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
          
          <Button title="Registrarse" onPress={handleRegister} style={{ marginTop: spacing.l }} />
          
          <Button 
            title="¿Ya tienes cuenta? Inicia sesión" 
            variant="ghost" 
            onPress={() => router.push('/(auth)/login')}
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
