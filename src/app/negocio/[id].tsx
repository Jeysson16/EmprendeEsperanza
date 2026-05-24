import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '@/shared/components/Typography';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { colors, spacing, radius, layout } from '@/core/theme';
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
      {/* Portada a Pantalla Completa en Web */}
      <View style={styles.coverImage}>
        <View style={layout.getContainerStyle()}>
          <Button 
            variant="ghost" 
            title="" 
            onPress={() => router.back()} 
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </Button>
        </View>
      </View>

      <View style={layout.getContainerStyle()}>
        <View style={styles.contentWrapper}>
          
          <View style={styles.mainColumn}>
            <View style={styles.profileHeader}>
              <View style={styles.logo} />
              <View style={{ flex: 1, marginLeft: spacing.m }}>
                <Typography variant="h1">Negocio Local {id}</Typography>
                <Typography variant="h3" color={colors.primary}>Comida Peruana • Abierto ahora</Typography>
              </View>
              <Button variant="outline" title="Compartir" onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              </Button>
            </View>

            <Card style={styles.infoCard}>
              <Typography variant="h3" style={{ marginBottom: spacing.s }}>Acerca de nosotros</Typography>
              <Typography variant="body1" style={{ marginBottom: spacing.m }}>
                Somos el mejor lugar para disfrutar de la gastronomía en La Esperanza. 
                Ven y disfruta de un ambiente familiar con platillos preparados con ingredientes 100% locales y frescos.
              </Typography>
              
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                </View>
                <Typography variant="body1" style={{ marginLeft: spacing.s, fontWeight: '500' }}>Av. Tahuantinsuyo 123, La Esperanza</Typography>
              </View>
              
              <View style={[styles.row, { marginTop: spacing.m }]}>
                <View style={styles.iconBox}>
                  <Ionicons name="call" size={20} color={colors.primary} />
                </View>
                <Typography variant="body1" style={{ marginLeft: spacing.s, fontWeight: '500' }}>+51 987 654 321</Typography>
              </View>
            </Card>
          </View>

          <View style={styles.productsColumn}>
            <Typography variant="h2" style={{ marginVertical: spacing.l }}>Nuestro Catálogo</Typography>
            <View style={styles.grid}>
              {[1, 2, 3, 4, 5, 6].map(item => (
                <Card key={item} style={styles.productCard} noPadding>
                  <View style={styles.productImage} />
                  <View style={{ padding: spacing.m }}>
                    <Typography variant="h3">Producto Premium {item}</Typography>
                    <Typography variant="body2" style={{ marginVertical: spacing.xs }}>Descripción deliciosa del producto local.</Typography>
                    <Typography variant="h2" color={colors.primary}>S/ 15.00</Typography>
                  </View>
                </Card>
              ))}
            </View>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  coverImage: {
    height: layout.isWebDesktop ? 350 : 220,
    backgroundColor: '#374151', // Dark gray placeholder
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.l,
    paddingHorizontal: spacing.m,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.round,
    padding: spacing.xs,
  },
  contentWrapper: {
    padding: spacing.l,
    marginTop: layout.isWebDesktop ? -80 : -40,
  },
  mainColumn: {
    width: '100%',
  },
  productsColumn: {
    width: '100%',
    marginTop: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.xl,
    marginBottom: spacing.l,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 },
      web: { boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }
    })
  },
  logo: {
    width: layout.isWebDesktop ? 100 : 70,
    height: layout.isWebDesktop ? 100 : 70,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },
  infoCard: {
    padding: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.s,
    borderRadius: radius.round,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: layout.isWebDesktop ? '31%' : '48%',
    marginBottom: spacing.l,
    overflow: 'hidden',
  },
  productImage: {
    height: 160,
    backgroundColor: '#EBEBEB',
  }
});
