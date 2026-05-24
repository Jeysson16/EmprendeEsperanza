import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/shared/components/Typography';
import { Input } from '@/shared/components/Input';
import { Card } from '@/shared/components/Card';
import { colors, spacing, radius, layout } from '@/core/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={layout.getContainerStyle()}>
          <Typography variant="h2" color={colors.surface}>La Esperanza</Typography>
          <Typography variant="body1" color={colors.surface} style={{ opacity: 0.9 }}>
            Descubre lo mejor cerca de ti
          </Typography>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={layout.getContainerStyle()}>
          <Input placeholder="¿Qué estás buscando hoy?" style={styles.searchInput} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={layout.getContainerStyle()}>
          <Typography variant="h3" style={{ marginBottom: spacing.m }}>Categorías Populares</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            {['Restaurantes', 'Farmacias', 'Bodegas', 'Servicios Profesionales'].map(cat => (
              <View key={cat} style={styles.categoryChip}>
                <Typography variant="body2" color={colors.primaryDark} style={{ fontWeight: '600' }}>{cat}</Typography>
              </View>
            ))}
          </ScrollView>

          <Typography variant="h3" style={{ marginVertical: spacing.l }}>Destacados cerca de ti</Typography>
          
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map(item => (
              <Card 
                key={item} 
                style={styles.businessCard}
                onPress={() => router.push(`/negocio/${item}`)}
              >
                <View style={styles.businessImage} />
                <View style={styles.businessInfo}>
                  <Typography variant="h3">Negocio Local {item}</Typography>
                  <Typography variant="body2">A 5 min de tu ubicación • Envío gratis</Typography>
                </View>
              </Card>
            ))}
          </View>
        </View>
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
    borderRadius: radius.xl, // Pill shape
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderWidth: 0,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15 },
      android: { elevation: 6 },
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }
    })
  },
  content: { padding: spacing.l, paddingBottom: 100 },
  categories: { flexDirection: 'row', marginBottom: spacing.m },
  categoryChip: {
    backgroundColor: colors.primaryLight + '20', // Suave transparente
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.round,
    marginRight: spacing.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  businessCard: {
    width: layout.isWebDesktop ? '31%' : '100%',
    marginBottom: spacing.l,
    padding: spacing.s,
    flexDirection: layout.isWebDesktop ? 'column' : 'row',
  },
  businessImage: {
    width: layout.isWebDesktop ? '100%' : 100,
    height: layout.isWebDesktop ? 160 : 100,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.l,
  },
  businessInfo: {
    flex: 1,
    marginLeft: layout.isWebDesktop ? 0 : spacing.m,
    marginTop: layout.isWebDesktop ? spacing.m : 0,
    justifyContent: 'center',
  }
});
