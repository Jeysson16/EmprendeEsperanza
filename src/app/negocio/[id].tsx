import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '@/shared/components/Typography';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { colors, spacing, radius } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';

export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      } else {
        await Share.share({
          message: `Mira este excelente comercio en La Esperanza: https://emprendeesperanza.com/negocio/${id}`
        });
      }
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Portada */}
      <View style={styles.coverImage}>
        <Button 
          variant="ghost" 
          title="" 
          onPress={() => router.back()} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.surface} />
        </Button>
      </View>

      {/* Contenido Principal (Web Centrado, Mobile Completo) */}
      <View style={styles.contentWrapper}>
        <View style={styles.profileHeader}>
          <View style={styles.logo} />
          <View style={{ flex: 1, marginLeft: spacing.m }}>
            <Typography variant="h2">Negocio Local {id}</Typography>
            <Typography variant="body2">Comida Peruana • Abierto</Typography>
          </View>
          <Button variant="ghost" title="" onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color={colors.primary} />
          </Button>
        </View>

        <Card style={styles.infoCard}>
          <Typography variant="body1" style={{ marginBottom: spacing.m }}>
            Somos el mejor lugar para disfrutar de la gastronomía en La Esperanza. 
            Ven y disfruta de un ambiente familiar.
          </Typography>
          
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color={colors.textMuted} />
            <Typography variant="body2" style={{ marginLeft: spacing.s }}>Av. Tahuantinsuyo 123</Typography>
          </View>
          
          <View style={[styles.row, { marginTop: spacing.s }]}>
            <Ionicons name="call-outline" size={20} color={colors.textMuted} />
            <Typography variant="body2" style={{ marginLeft: spacing.s }}>+51 987 654 321</Typography>
          </View>
        </Card>

        <Typography variant="h3" style={{ marginVertical: spacing.l }}>Catálogo / Productos</Typography>
        
        <View style={styles.grid}>
          {[1, 2, 3, 4].map(item => (
            <Card key={item} style={styles.productCard} noPadding>
              <View style={styles.productImage} />
              <View style={{ padding: spacing.s }}>
                <Typography variant="body1">Producto {item}</Typography>
                <Typography variant="h3" color={colors.primary}>S/ 15.00</Typography>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  coverImage: {
    height: 200,
    backgroundColor: '#CCCCCC',
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.l,
    paddingHorizontal: spacing.m,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.round,
    padding: spacing.xs,
  },
  contentWrapper: {
    padding: spacing.l,
    marginTop: -40,
    maxWidth: 800, // Optimize for Web
    alignSelf: 'center',
    width: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: radius.l,
    marginBottom: spacing.l,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }
    })
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },
  infoCard: {
    marginBottom: spacing.l,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: spacing.m,
    overflow: 'hidden',
  },
  productImage: {
    height: 120,
    backgroundColor: '#EBEBEB',
  }
});
