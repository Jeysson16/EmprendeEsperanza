import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing, layout } from '@/core/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={layout.getContainerStyle()}>
        <View style={styles.header}>
          <Typography variant="h1" color={colors.primary} align="center">EmprendeEsperanza</Typography>
          <Typography variant="body1" align="center" style={{ marginTop: spacing.s, maxWidth: 400, alignSelf: 'center' }}>
            Descubre y apoya los comercios locales de La Esperanza. La mejor plataforma para crecer juntos.
          </Typography>
        </View>
        
        <Card style={styles.card}>
          <Typography variant="h3" align="center" style={{ marginBottom: spacing.xl }}>
            ¿Cómo deseas ingresar?
          </Typography>
          
          <Button 
            title="Explorar como Cliente" 
            onPress={() => router.push('/(tabs)')} 
            style={{ marginBottom: spacing.m }}
          />
          <Button 
            title="Gestionar mi Negocio" 
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
