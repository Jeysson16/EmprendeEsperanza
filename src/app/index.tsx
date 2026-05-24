import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing, layout } from '@/core/theme';
import { useAuth } from '@/core/context/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Si ya está cargando el estado de autenticación, mostramos un indicador de carga
  if (loading) {
    return (
      <View style={[styles.scroll, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={layout.getContainerStyle()}>
        <View style={styles.header}>
          <Typography variant="h1" color={colors.primary} align="center">EmprendeEsperanza</Typography>
          <Typography variant="body1" align="center" style={{ marginTop: spacing.s, maxWidth: 450, alignSelf: 'center', color: colors.textMuted }}>
            Descubre y apoya los comercios locales de La Esperanza. La mejor plataforma para conectar clientes y emprendedores del barrio.
          </Typography>
        </View>
        
        <Card style={styles.card}>
          <Typography variant="h3" align="center" style={{ marginBottom: spacing.xl, fontWeight: 'bold' }}>
            ¿Cómo deseas ingresar?
          </Typography>
          
          <Button 
            title="Explorar como Invitado" 
            onPress={() => router.push('/(tabs)')} 
            style={{ marginBottom: spacing.m }}
          />
          <Button 
            title="Iniciar Sesión / Registrarse" 
            variant="outline"
            onPress={() => router.push('/(auth)/login')} 
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  card: {
    padding: spacing.xxl,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  }
});

