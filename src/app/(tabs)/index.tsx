import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/shared/components/Typography';
import { Input } from '@/shared/components/Input';
import { Card } from '@/shared/components/Card';
import { colors, spacing, radius } from '@/core/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" color={colors.surface}>La Esperanza</Typography>
        <Typography variant="body2" color={colors.surface}>Descubre lo mejor cerca de ti</Typography>
      </View>
      
      <View style={styles.searchContainer}>
        <Input placeholder="¿Qué estás buscando?" style={styles.searchInput} />
      </View>

      <ScrollView style={styles.content}>
        <Typography variant="h3" style={{ marginBottom: spacing.m }}>Categorías Populares</Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {['Restaurantes', 'Farmacias', 'Bodegas', 'Servicios'].map(cat => (
            <View key={cat} style={styles.categoryChip}>
              <Typography variant="body2" color={colors.primary}>{cat}</Typography>
            </View>
          ))}
        </ScrollView>

        <Typography variant="h3" style={{ marginVertical: spacing.m }}>Cerca de ti</Typography>
        {[1, 2, 3].map(item => (
          <Pressable key={item} onPress={() => router.push(`/negocio/${item}`)}>
            <Card style={styles.businessCard}>
              <View style={styles.businessImage} />
              <View style={styles.businessInfo}>
                <Typography variant="h3">Negocio Local {item}</Typography>
                <Typography variant="body2">A 5 min de tu ubicación</Typography>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    backgroundColor: colors.primary, 
    padding: spacing.l, 
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.xxl 
  },
  searchContainer: {
    marginTop: -25,
    paddingHorizontal: spacing.l,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    paddingHorizontal: spacing.l,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
    })
  },
  content: { padding: spacing.l },
  categories: { flexDirection: 'row', marginBottom: spacing.m },
  categoryChip: {
    backgroundColor: '#FF5A5F20',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.round,
    marginRight: spacing.s,
  },
  businessCard: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    padding: spacing.s,
  },
  businessImage: {
    width: 80,
    height: 80,
    backgroundColor: '#EBEBEB',
    borderRadius: radius.m,
  },
  businessInfo: {
    flex: 1,
    marginLeft: spacing.m,
    justifyContent: 'center',
  }
});
