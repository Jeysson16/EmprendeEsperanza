import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing } from '@/core/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1" color={colors.primary} align="center">EmprendeEsperanza</Typography>
        <Typography variant="body1" align="center" style={{ marginTop: spacing.s }}>
          Descubre y apoya los comercios locales de La Esperanza
        </Typography>
      </View>
      
      <Card style={styles.card}>
        <Typography variant="h3" align="center" style={{ marginBottom: spacing.l }}>
          ¿Cómo deseas ingresar?
        </Typography>
        
        <Button 
          title="Soy Cliente" 
          onPress={() => router.push('/(tabs)')} 
          style={{ marginBottom: spacing.m }}
        />
        <Button 
          title="Soy Emprendedor" 
          variant="outline"
          onPress={() => router.push('/(auth)/login')} 
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  card: {
    padding: spacing.xl,
  }
});
