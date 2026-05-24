import React, { useEffect, useState, useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, Image, Platform, ActivityIndicator, Pressable, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/shared/components/Typography';
import { colors, spacing, radius, layout, shadows } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, getBusinesses, Category, Business } from '@/core/services/firebaseService';
import * as Location from 'expo-location';

// ─── Skeleton for category card ────────────────────────────────────────────
function CategorySkeleton() {
  return (
    <View style={[styles.cardContainer, { backgroundColor: '#E5E7EB' }]}>
      <View style={{ flex: 1, backgroundColor: '#D1D5DB', borderRadius: radius.xl }} />
    </View>
  );
}

// ─── Category card with image preload ──────────────────────────────────────
function CategoryCard({
  cat, isSelected, onPress
}: { cat: Category; isSelected: boolean; onPress: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        isSelected && styles.cardSelected,
        pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }
      ]}
    >
      {/* Image */}
      {cat.imageUrl && !error ? (
        <>
          {!loaded && (
            <View style={[styles.cardImageFull, { backgroundColor: '#E5E7EB', borderRadius: radius.xl }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          <Image
            source={{ uri: cat.imageUrl }}
            style={[styles.cardImageFull, !loaded && { opacity: 0 }]}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        </>
      ) : (
        <View style={[styles.cardImageFull, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={colors.textMuted} />
        </View>
      )}

      {/* Dark overlay */}
      <View style={[styles.overlay, isSelected && styles.overlaySelected]} />

      {/* Selection indicator */}
      {isSelected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
        </View>
      )}

      {/* Label */}
      <View style={styles.labelWrap}>
        <Typography variant="body2" color="#fff" style={styles.cardTitle}>
          {cat.name}
        </Typography>
      </View>
    </Pressable>
  );
}

// ─── Business result card (filtrado por categoría) ──────────────────────────
function BusinessResultCard({
  business, onPress
}: { business: Business & { distance?: number }; onPress: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [bizStyles.card, pressed && { opacity: 0.88 }]}
    >
      <View style={bizStyles.imgWrap}>
        {business.imageUrl ? (
          <>
            {!imgLoaded && <View style={bizStyles.imgSkeleton} />}
            <Image
              source={{ uri: business.imageUrl }}
              style={bizStyles.img}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <View style={bizStyles.imgPlaceholder}>
            <Ionicons name="storefront-outline" size={24} color={colors.textMuted} />
          </View>
        )}
      </View>
      <View style={bizStyles.info}>
        <Typography variant="body1" style={{ fontWeight: 'bold' }} numberOfLines={1}>
          {business.name}
        </Typography>
        <Typography variant="caption" color={colors.primary}>{business.category}</Typography>
        {business.description ? (
          <Typography variant="body2" color={colors.textMuted} numberOfLines={2}>
            {business.description}
          </Typography>
        ) : null}
        {business.distance !== undefined && (
          <View style={bizStyles.distRow}>
            <Ionicons name="location-outline" size={12} color={colors.primary} />
            <Typography variant="caption" style={{ marginLeft: 3, color: colors.primary }}>
              {business.distance < 1
                ? `${(business.distance * 1000).toFixed(0)} m`
                : `${business.distance.toFixed(1)} km`}
            </Typography>
            <View style={[bizStyles.statusDot, { backgroundColor: business.isOpen ? '#10B981' : '#6B7280' }]} />
            <Typography variant="caption" color={business.isOpen ? '#10B981' : '#6B7280'}>
              {business.isOpen ? 'Abierto' : 'Cerrado'}
            </Typography>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ alignSelf: 'center' }} />
    </Pressable>
  );
}

const bizStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.soft,
  },
  imgWrap: { width: 80, minHeight: 80, position: 'relative' },
  imgSkeleton: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#E5E7EB',
  },
  img: { width: 80, height: '100%', minHeight: 80 },
  imgPlaceholder: {
    width: 80, height: 80,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, padding: spacing.m },
  distRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ExploraScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<(Business & { distance?: number })[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingBiz, setLoadingBiz] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const cats = await getCategories();
      setCategories(cats);
      setLoadingCats(false);

      // Get user location for distance calculation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  const handleCategorySelect = async (cat: Category) => {
    const isDeselecting = selectedCategory?.id === cat.id;
    if (isDeselecting) {
      setSelectedCategory(null);
      setBusinesses([]);
      return;
    }
    setSelectedCategory(cat);
    setLoadingBiz(true);
    try {
      const data = await getBusinesses(location?.latitude, location?.longitude);
      setBusinesses(data.filter(b => b.category === cat.name));
    } finally {
      setLoadingBiz(false);
    }
  };

  const filteredBusinesses = useMemo(() => {
    if (!searchQuery) return businesses;
    return businesses.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [businesses, searchQuery]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={layout.getContainerStyle()}>

        {/* Header */}
        <View style={styles.headerWrap}>
          <View>
            <Typography variant="h1" style={styles.title}>Explora tu Barrio</Typography>
            <Typography variant="body2" color={colors.textMuted}>
              Descubre los comercios de La Esperanza
            </Typography>
          </View>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Typography variant="caption" color={colors.primary} style={{ marginLeft: 3, fontWeight: '600' }}>
              {location ? 'Ubicado' : 'Sin ubicación'}
            </Typography>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Buscar en el barrio..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Categories section title */}
        <View style={styles.sectionHeader}>
          <Typography variant="h3" style={styles.sectionTitle}>Categorías</Typography>
          {selectedCategory && (
            <Pressable
              style={styles.clearBtn}
              onPress={() => { setSelectedCategory(null); setBusinesses([]); }}
            >
              <Typography variant="caption" color={colors.primary}>Limpiar filtro</Typography>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {/* Category grid */}
        {loadingCats ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4].map(i => <CategorySkeleton key={i} />)}
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyCategories}>
            <Ionicons name="grid-outline" size={40} color={colors.textMuted} />
            <Typography variant="body2" color={colors.textMuted} style={{ marginTop: spacing.s, textAlign: 'center' }}>
              No hay categorías. El administrador debe crear algunas.
            </Typography>
          </View>
        ) : (
          <View style={styles.grid}>
            {categories.map(cat => (
              <CategoryCard
                key={cat.id || cat.name}
                cat={cat}
                isSelected={selectedCategory?.id === cat.id}
                onPress={() => handleCategorySelect(cat)}
              />
            ))}
          </View>
        )}

        {/* Business results */}
        {selectedCategory && (
          <View style={styles.resultsSection}>
            <View style={styles.sectionHeader}>
              <Typography variant="h3" style={styles.sectionTitle}>
                {selectedCategory.name}
              </Typography>
              <Typography variant="caption" color={colors.textMuted}>
                {filteredBusinesses.length} resultado{filteredBusinesses.length !== 1 ? 's' : ''}
              </Typography>
            </View>

            {loadingBiz ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : filteredBusinesses.length === 0 ? (
              <View style={styles.emptyResults}>
                <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
                <Typography variant="body1" color={colors.textMuted} style={{ marginTop: spacing.m, textAlign: 'center' }}>
                  No hay comercios registrados en "{selectedCategory.name}"
                </Typography>
              </View>
            ) : (
              filteredBusinesses.map(b => (
                <BusinessResultCard
                  key={b.id || b.name}
                  business={b}
                  onPress={() => router.push(`/negocio/${b.id}`)}
                />
              ))
            )}
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
    paddingBottom: 120,
  },
  headerWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.l,
  },
  title: { marginBottom: 2 },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: radius.round,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    gap: spacing.s,
    marginBottom: spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: { fontWeight: 'bold' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.s,
    paddingVertical: 3,
    borderRadius: radius.round,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.l,
  },
  cardContainer: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: spacing.m,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.medium,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  cardImageFull: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholder: {
    backgroundColor: '#F3F4F6',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    borderRadius: radius.xl,
  },
  overlaySelected: {
    backgroundColor: 'rgba(16, 97, 61, 0.55)',
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.s,
  },
  labelWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.m,
  },
  cardTitle: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyCategories: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  resultsSection: {
    marginTop: spacing.m,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
});
