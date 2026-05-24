import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography } from '@/shared/components/Typography';
import { Input } from '@/shared/components/Input';
import { Card } from '@/shared/components/Card';
import { colors, spacing, radius } from '@/core/theme';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">Buscar</Typography>
        <Input placeholder="Buscar por nombre o categoría..." style={{ marginTop: spacing.m }} />
      </View>

      <ScrollView style={styles.content}>
        <Typography variant="h3" style={{ marginBottom: spacing.m }}>Todas las Categorías</Typography>
        <View style={styles.grid}>
          {['Comida', 'Salud', 'Hogar', 'Mascotas', 'Tecnología', 'Moda'].map(cat => (
            <Card key={cat} style={styles.categoryCard}>
              <View style={styles.categoryIcon} />
              <Typography variant="body1" align="center">{cat}</Typography>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: spacing.l,
    paddingTop: 60,
    backgroundColor: colors.surface,
  },
  content: { padding: spacing.l },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: spacing.m,
    alignItems: 'center',
    padding: spacing.m,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FF5A5F30',
    borderRadius: radius.round,
    marginBottom: spacing.s,
  }
});
