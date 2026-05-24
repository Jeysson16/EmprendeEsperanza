import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing, radius, layout, shadows } from '@/core/theme';
import { Pressable } from 'react-native';
import { getCategories, Category } from '@/core/services/firebaseService';

export default function CatalogScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      setCategories(data);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={layout.getContainerStyle()}>
        
        <Typography variant="h1" style={styles.title}>Explora tu Barrio</Typography>

        <View style={styles.filtersRow}>
          <View style={[styles.filterChip, styles.filterChipActive]}>
            <Typography variant="body2" style={styles.filterTextActive}>Abierto ahora</Typography>
          </View>
          <View style={styles.filterChip}>
            <Typography variant="body2">Más cercanos</Typography>
          </View>
          <View style={styles.filterChip}>
            <Typography variant="body2">Popular</Typography>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : (
          <View style={styles.grid}>
            {categories.map(cat => (
              <Pressable 
                key={cat.id || cat.name} 
                style={styles.cardContainer}
                onPress={() => {}}
              >
                <ImageBackground 
                  source={{ uri: cat.imageUrl }} 
                  style={styles.cardImage}
                  imageStyle={styles.cardImageStyle}
                >
                  <View style={styles.overlay} />
                  <Typography variant="h3" color={colors.surface} style={styles.cardTitle}>
                    {cat.name}
                  </Typography>
                </ImageBackground>
              </Pressable>
            ))}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.l,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: 100,
  },
  title: {
    marginBottom: spacing.l,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.round,
    marginRight: spacing.s,
    ...shadows.soft,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight + '20', // Verde muy clarito
  },
  filterTextActive: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%',
    aspectRatio: 1, // Cuadradas
    marginBottom: spacing.m,
    ...shadows.medium,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: spacing.m,
  },
  cardImageStyle: {
    borderRadius: radius.xl, // Esquinas super redondeadas como en mockup
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.4)', // Dark overlay
    borderRadius: radius.xl,
  },
  cardTitle: {
    fontWeight: 'bold',
    zIndex: 1,
  }
});
