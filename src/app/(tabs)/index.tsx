import React, { useState, useEffect, useMemo } from 'react';
import {
  View, StyleSheet, Platform, Pressable, Alert, ScrollView, TextInput,
  ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Typography } from '@/shared/components/Typography';
import { Card } from '@/shared/components/Card';
import CustomMap from '@/shared/components/Map';
import {
  getBusinesses, getCategories, Business, Category, seedInitialData
} from '@/core/services/firebaseService';
import { colors, spacing, radius, shadows, layout } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/core/context/AuthContext';

// ─── Skeleton placeholder card ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={skStyles.card}>
      <View style={skStyles.image} />
      <View style={skStyles.body}>
        <View style={[skStyles.line, { width: '70%' }]} />
        <View style={[skStyles.line, { width: '45%', marginTop: 8 }]} />
        <View style={[skStyles.line, { width: '30%', marginTop: 8 }]} />
      </View>
    </View>
  );
}
const skStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    marginBottom: spacing.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: '#E5E7EB',
  },
  body: {
    flex: 1,
    padding: spacing.m,
    justifyContent: 'center',
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
});

// ─── Business list card ───────────────────────────────────────────────────────
function BusinessCard({
  business, onPress
}: { business: Business & { distance?: number }, onPress: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [listStyles.card, pressed && listStyles.cardPressed]}>
      <View style={listStyles.imgWrap}>
        {business.imageUrl && !imgError ? (
          <>
            {!imgLoaded && <View style={listStyles.imgSkeleton} />}
            <Image
              source={{ uri: business.imageUrl }}
              style={[listStyles.img, !imgLoaded && { opacity: 0 }]}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <View style={listStyles.imgPlaceholder}>
            <Ionicons name="storefront-outline" size={28} color={colors.textMuted} />
          </View>
        )}
        <View style={[listStyles.openBadge, { backgroundColor: business.isOpen ? '#10B981' : '#6B7280' }]}>
          <Typography variant="caption" style={{ color: '#fff', fontWeight: 'bold', fontSize: 9 }}>
            {business.isOpen ? 'ABIERTO' : 'CERRADO'}
          </Typography>
        </View>
      </View>

      <View style={listStyles.info}>
        <Typography variant="body1" style={{ fontWeight: 'bold' }} numberOfLines={1}>
          {business.name}
        </Typography>
        <View style={listStyles.categoryRow}>
          <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
          <Typography variant="caption" color={colors.primary} style={{ marginLeft: 4 }}>
            {business.category}
          </Typography>
        </View>
        {business.description ? (
          <Typography variant="body2" color={colors.textMuted} numberOfLines={2} style={{ marginTop: 2 }}>
            {business.description}
          </Typography>
        ) : null}
        <View style={listStyles.metaRow}>
          {business.distance !== undefined && (
            <View style={listStyles.distancePill}>
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Typography variant="caption" style={{ marginLeft: 3, color: colors.primary, fontWeight: '600' }}>
                {business.distance < 1
                  ? `${(business.distance * 1000).toFixed(0)} m`
                  : `${business.distance.toFixed(1)} km`}
              </Typography>
            </View>
          )}
          {business.address ? (
            <Typography variant="caption" color={colors.textMuted} numberOfLines={1} style={{ flex: 1, marginLeft: spacing.s }}>
              {business.address}
            </Typography>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ alignSelf: 'center', marginRight: spacing.s }} />
    </Pressable>
  );
}

const listStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    marginBottom: spacing.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  imgWrap: { width: 90, minHeight: 90, position: 'relative' },
  imgSkeleton: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#E5E7EB',
  },
  img: { width: 90, height: '100%', minHeight: 90 },
  imgPlaceholder: {
    width: 90, height: 90,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  openBadge: {
    position: 'absolute', bottom: 6, left: 4,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4,
  },
  info: { flex: 1, padding: spacing.m },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.s },
  distancePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 10,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const { user, userProfile, logoutUser } = useAuth();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [businesses, setBusinesses] = useState<(Business & { distance?: number })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      // Load categories
      const cats = await getCategories();
      setCategories(cats);

      // Get location
      let coords: { latitude: number; longitude: number } | undefined;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocation(coords);
      }

      // Fetch businesses
      const data = await getBusinesses(coords?.latitude, coords?.longitude);
      setBusinesses(data);
      setLoadingData(false);
    })();
  }, []);

  const handleSeed = async () => {
    const loc = location || { latitude: -8.0777, longitude: -79.0354 };
    await seedInitialData(loc.latitude, loc.longitude);
    const data = await getBusinesses(loc.latitude, loc.longitude);
    setBusinesses(data);
    const cats = await getCategories();
    setCategories(cats);
    alert('Datos de prueba generados!');
  };

  const handleProfilePress = () => {
    if (!user) {
      router.push('/(auth)/login');
    } else {
      Alert.alert(
        `${userProfile?.displayName || 'Usuario'}`,
        `Rol: ${userProfile?.role === 'emprendedor' ? 'Emprendedor' : 'Cliente'}\nCorreo: ${user.email}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          ...(userProfile?.role === 'emprendedor' ? [
            { text: 'Panel de Control', onPress: () => router.push('/(emprendedor)/dashboard') }
          ] : []),
          {
            text: 'Cerrar Sesión', style: 'destructive', onPress: async () => {
              try { await logoutUser(); router.replace('/'); } catch (err) { console.error(err); }
            }
          }
        ]
      );
    }
  };

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const matchesCategory = !selectedCategory || b.category === selectedCategory;
      const matchesSearch = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [businesses, selectedCategory, searchQuery]);

  return (
    <View style={styles.container}>
      {/* MAP LAYER */}
      <View style={StyleSheet.absoluteFill}>
        <CustomMap
          businesses={filteredBusinesses}
          userLocation={location}
          onSelectBusiness={setSelectedBusiness}
        />
      </View>

      {/* FLOATING OVERLAYS */}
      <View style={[styles.floatingContainer, layout.getContainerStyle()]}>

        {/* ── TOP: Search + Profile + Categories ── */}
        <View style={styles.topOverlay}>
          {/* Search Bar + Profile */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.primary} />
              <TextInput
                placeholder="Buscar negocios..."
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
            <Pressable style={styles.profileBtn} onPress={handleProfilePress}>
              <Ionicons
                name={user ? 'person-circle' : 'log-in-outline'}
                size={26}
                color={user ? colors.primary : colors.text}
              />
            </Pressable>
          </View>

          {/* Category chips */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: spacing.m }}
              contentContainerStyle={{ paddingRight: spacing.m }}
            >
              {/* "Todos" chip */}
              <Pressable
                style={[styles.chip, !selectedCategory && styles.chipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Ionicons name="grid" size={14} color={!selectedCategory ? '#fff' : colors.primary} />
                <Typography
                  variant="caption"
                  style={[styles.chipText, !selectedCategory && styles.chipTextActive]}
                >
                  Todos
                </Typography>
              </Pressable>

              {categories.map(cat => {
                const isActive = selectedCategory === cat.name;
                return (
                  <Pressable
                    key={cat.id || cat.name}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedCategory(isActive ? null : cat.name)}
                  >
                    <Typography
                      variant="caption"
                      style={[styles.chipText, isActive && styles.chipTextActive]}
                    >
                      {cat.name}
                    </Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Seed button if empty */}
          {businesses.length === 0 && !loadingData && (
            <Pressable style={styles.seedBtn} onPress={handleSeed}>
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Typography variant="body2" style={{ color: '#fff', marginLeft: spacing.s, fontWeight: '600' }}>
                Generar datos de prueba
              </Typography>
            </Pressable>
          )}
        </View>

        {/* ── TOGGLE: Map / List ── */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map-outline" size={18} color={viewMode === 'map' ? '#fff' : colors.text} />
            <Typography
              variant="caption"
              style={[styles.toggleLabel, viewMode === 'map' && { color: '#fff' }]}
            >
              Mapa
            </Typography>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? '#fff' : colors.text} />
            <Typography
              variant="caption"
              style={[styles.toggleLabel, viewMode === 'list' && { color: '#fff' }]}
            >
              Lista
            </Typography>
          </Pressable>
        </View>

        {/* ── LIST VIEW: shown when viewMode === 'list' ── */}
        {viewMode === 'list' && (
          <View style={styles.listOverlay}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: spacing.m, paddingBottom: 90 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m }}>
                <Typography variant="body1" style={{ fontWeight: 'bold', flex: 1 }}>
                  {filteredBusinesses.length} comercio{filteredBusinesses.length !== 1 ? 's' : ''}
                  {selectedCategory ? ` · ${selectedCategory}` : ' cerca de ti'}
                </Typography>
              </View>

              {loadingData ? (
                <>
                  <SkeletonCard /><SkeletonCard /><SkeletonCard />
                </>
              ) : filteredBusinesses.length === 0 ? (
                <View style={styles.emptyList}>
                  <Ionicons name="storefront-outline" size={48} color={colors.textMuted} />
                  <Typography variant="body1" color={colors.textMuted} style={{ marginTop: spacing.m, textAlign: 'center' }}>
                    No se encontraron comercios{selectedCategory ? ` en "${selectedCategory}"` : ''}
                  </Typography>
                </View>
              ) : (
                filteredBusinesses.map(b => (
                  <BusinessCard
                    key={b.id || b.name}
                    business={b}
                    onPress={() => router.push(`/negocio/${b.id}`)}
                  />
                ))
              )}
            </ScrollView>
          </View>
        )}

        {/* ── BOTTOM: Selected business card (map mode) ── */}
        {viewMode === 'map' && selectedBusiness && (
          <View style={styles.bottomOverlay}>
            <Card style={styles.selectedCard} noPadding>
              <View style={styles.cardHeader}>
                <View style={styles.cardBadge}>
                  <Typography variant="caption" color={selectedBusiness.isOpen ? colors.success : colors.textMuted} style={{ fontWeight: 'bold' }}>
                    {selectedBusiness.isOpen ? 'ABIERTO' : 'CERRADO'}
                  </Typography>
                </View>
                {selectedBusiness.distance !== undefined && (
                  <View style={styles.distanceBadge}>
                    <Ionicons name="location-outline" size={12} color={colors.primary} />
                    <Typography variant="caption" style={{ marginLeft: 4, color: colors.primary }}>
                      {selectedBusiness.distance < 1
                        ? `${(selectedBusiness.distance * 1000).toFixed(0)} m`
                        : `${selectedBusiness.distance.toFixed(1)} km`}
                    </Typography>
                  </View>
                )}
                <Pressable style={{ marginLeft: 'auto' }} onPress={() => setSelectedBusiness(null)}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardImageWrap}>
                  {selectedBusiness.imageUrl ? (
                    <Image
                      source={{ uri: selectedBusiness.imageUrl }}
                      style={styles.cardImage}
                    />
                  ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                      <Ionicons name="storefront-outline" size={28} color={colors.textMuted} />
                    </View>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <Typography variant="h3" numberOfLines={1}>{selectedBusiness.name}</Typography>
                  <Typography variant="caption" color={colors.primary}>{selectedBusiness.category}</Typography>
                  {selectedBusiness.description ? (
                    <Typography variant="body2" numberOfLines={2} color={colors.textMuted}>
                      {selectedBusiness.description}
                    </Typography>
                  ) : null}
                  <Pressable
                    style={styles.verPerfilBtn}
                    onPress={() => router.push(`/negocio/${selectedBusiness.id}`)}
                  >
                    <Typography variant="body2" style={{ color: '#fff', fontWeight: 'bold' }}>Ver Tienda</Typography>
                    <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 4 }} />
                  </Pressable>
                </View>
              </View>
            </Card>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  floatingContainer: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
    justifyContent: 'space-between',
  },
  topOverlay: {
    paddingHorizontal: spacing.l,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.s,
    pointerEvents: 'box-none',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    ...shadows.medium,
    gap: spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : 0,
  },
  profileBtn: {
    marginLeft: spacing.s,
    backgroundColor: colors.surface,
    padding: spacing.s,
    borderRadius: radius.round,
    ...shadows.medium,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    marginRight: spacing.s,
    ...shadows.soft,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#fff',
  },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.l,
    paddingVertical: spacing.m,
    marginTop: spacing.m,
    ...shadows.soft,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    padding: 3,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
    pointerEvents: 'box-none',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.round,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleLabel: {
    fontWeight: '600',
    fontSize: 12,
    color: colors.text,
  },
  listOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 160 : 140,
    left: 0,
    right: 0,
    bottom: 60,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.floating,
    overflow: 'hidden',
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  bottomOverlay: {
    padding: spacing.l,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    ...shadows.floating,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.s,
  },
  cardBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: radius.s,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.s,
  },
  cardContent: {
    flexDirection: 'row',
    padding: spacing.m,
  },
  cardImageWrap: { borderRadius: radius.m, overflow: 'hidden' },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: radius.m,
    backgroundColor: '#EBEBEB',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.m,
    justifyContent: 'center',
    gap: 3,
  },
  verPerfilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.m,
    alignSelf: 'flex-start',
    marginTop: spacing.s,
  },
});
