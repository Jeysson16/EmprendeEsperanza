import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, StyleSheet, Platform, Pressable, Alert, ScrollView, TextInput,
  ActivityIndicator, Image, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Typography } from '@/shared/components/Typography';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import CustomMap from '@/shared/components/Map';
import { MapRegion } from '@/shared/components/Map/CustomMap';
import {
  getBusinesses, getCategories, Business, Category, seedInitialData
} from '@/core/services/firebaseService';
import { colors, spacing, radius, shadows, layout } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/core/context/AuthContext';

// ─── Compute best region to show all given businesses ────────────────────────
function getBoundsForBusinesses(
  businesses: Business[],
  userLocation?: { latitude: number; longitude: number } | null
): MapRegion | null {
  const points = [
    ...businesses.map(b => ({ lat: b.location.latitude, lng: b.location.longitude })),
    ...(userLocation ? [{ lat: userLocation.latitude, lng: userLocation.longitude }] : [])
  ];
  if (points.length === 0) return null;

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const spanLat = Math.max(maxLat - minLat, 0.005);
  const spanLng = Math.max(maxLng - minLng, 0.005);
  const bboxOffset = Math.max(spanLat, spanLng) / 2 * 1.4; // 40% padding

  return { latitude: centerLat, longitude: centerLng, bboxOffset };
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const { user, userProfile, logoutUser } = useAuth();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [businesses, setBusinesses] = useState<(Business & { distance?: number })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<(Business & { distance?: number }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);

  useEffect(() => {
    (async () => {
      const cats = await getCategories();
      setCategories(cats);

      let coords: { latitude: number; longitude: number } | undefined;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocation(coords);
        setMapRegion({ latitude: coords.latitude, longitude: coords.longitude, bboxOffset: 0.015 });
      }

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

  // Filter businesses by category and search
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const matchesCategory = !selectedCategory || b.category === selectedCategory;
      const matchesSearch = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [businesses, selectedCategory, searchQuery]);

  // When a category is selected, zoom map to matching businesses
  const handleCategorySelect = useCallback((catName: string | null) => {
    setSelectedCategory(catName);
    setSelectedBusiness(null);

    if (!catName) {
      // Reset to user location zoom
      if (location) {
        setMapRegion({ latitude: location.latitude, longitude: location.longitude, bboxOffset: 0.015 });
      }
      return;
    }

    const matching = businesses.filter(b => b.category === catName);
    if (matching.length > 0) {
      const region = getBoundsForBusinesses(matching, location);
      if (region) setMapRegion(region);
    }
  }, [businesses, location]);

  // When searching, zoom to matching businesses
  useEffect(() => {
    if (!searchQuery) {
      if (location) setMapRegion({ latitude: location.latitude, longitude: location.longitude, bboxOffset: 0.015 });
      return;
    }
    if (filteredBusinesses.length > 0) {
      const region = getBoundsForBusinesses(filteredBusinesses, location);
      if (region) setMapRegion(region);
    }
  }, [searchQuery, filteredBusinesses]);

  // When a marker is selected, zoom to that business
  const handleSelectBusiness = useCallback((b: Business) => {
    setSelectedBusiness(b as Business & { distance?: number });
    setMapRegion({
      latitude: b.location.latitude,
      longitude: b.location.longitude,
      bboxOffset: 0.006,
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* MAP - full screen behind overlays */}
      <View style={StyleSheet.absoluteFill}>
        <CustomMap
          businesses={filteredBusinesses}
          userLocation={location}
          onSelectBusiness={handleSelectBusiness}
          region={mapRegion}
        />
      </View>

      {/* ── TOP OVERLAY: Search + Profile + Category chips ── */}
      <View style={styles.topContainer} pointerEvents="box-none">

        {/* Search bar row - full width */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.primary} />
            <TextInput
              placeholder="Buscar negocios en La Esperanza..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
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

        {/* Category chips horizontal scroll */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.s }}
            contentContainerStyle={{ paddingRight: spacing.m }}
            pointerEvents="box-none"
          >
            <Pressable
              style={[styles.chip, !selectedCategory && styles.chipActive]}
              onPress={() => handleCategorySelect(null)}
            >
              <Ionicons name="grid" size={13} color={!selectedCategory ? '#fff' : colors.primary} />
              <Typography variant="caption" style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>
                Todos
              </Typography>
            </Pressable>

            {categories.map(cat => {
              const isActive = selectedCategory === cat.name;
              return (
                <Pressable
                  key={cat.id || cat.name}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => handleCategorySelect(isActive ? null : cat.name)}
                >
                  <Typography variant="caption" style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {cat.name}
                  </Typography>
                  {isActive && (
                    <View style={styles.chipCount}>
                      <Typography style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                        {filteredBusinesses.length}
                      </Typography>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Seed button */}
        {businesses.length === 0 && !loadingData && (
          <Pressable style={styles.seedBtn} onPress={handleSeed}>
            <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
            <Typography variant="body2" style={{ color: '#fff', marginLeft: spacing.s, fontWeight: '600' }}>
              Generar datos de prueba
            </Typography>
          </Pressable>
        )}

        {/* Search results count badge */}
        {(searchQuery || selectedCategory) && !loadingData && (
          <View style={styles.resultsBadge}>
            <Ionicons name="storefront-outline" size={13} color={colors.primary} />
            <Typography variant="caption" color={colors.primary} style={{ marginLeft: 4, fontWeight: '600' }}>
              {filteredBusinesses.length} resultado{filteredBusinesses.length !== 1 ? 's' : ''}
            </Typography>
          </View>
        )}
      </View>

      {/* ── BOTTOM OVERLAY: Selected business card ── */}
      {selectedBusiness && (
        <View style={styles.bottomSheet} pointerEvents="box-none">
          <View style={styles.selectedCard}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header: status + distance + close */}
            <View style={styles.cardHeader}>
              <View style={[styles.openBadge, { backgroundColor: selectedBusiness.isOpen ? '#DCFCE7' : '#F3F4F6' }]}>
                <View style={[styles.openDot, { backgroundColor: selectedBusiness.isOpen ? '#10B981' : '#6B7280' }]} />
                <Typography variant="caption" style={{ color: selectedBusiness.isOpen ? '#10B981' : '#6B7280', fontWeight: '700', fontSize: 11 }}>
                  {selectedBusiness.isOpen ? 'ABIERTO' : 'CERRADO'}
                </Typography>
                {selectedBusiness.openingHours && (
                  <Typography variant="caption" style={{ color: colors.textMuted, marginLeft: 4, fontSize: 10 }}>
                    · {selectedBusiness.openingHours.open}–{selectedBusiness.openingHours.close}
                  </Typography>
                )}
              </View>

              {selectedBusiness.distance !== undefined && (
                <View style={styles.distancePill}>
                  <Ionicons name="location-outline" size={12} color={colors.primary} />
                  <Typography variant="caption" style={{ marginLeft: 3, color: colors.primary, fontWeight: '600' }}>
                    {selectedBusiness.distance < 1
                      ? `${(selectedBusiness.distance * 1000).toFixed(0)} m`
                      : `${selectedBusiness.distance.toFixed(1)} km`}
                  </Typography>
                </View>
              )}

              <Pressable style={{ marginLeft: 'auto', padding: 4 }} onPress={() => setSelectedBusiness(null)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Content: image + info + button */}
            <View style={styles.cardContent}>
              {/* Cover image */}
              <View style={styles.cardImageWrap}>
                {selectedBusiness.imageUrl ? (
                  <Image source={{ uri: selectedBusiness.imageUrl }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Ionicons name="storefront-outline" size={30} color={colors.textMuted} />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Typography variant="h3" numberOfLines={1} style={{ marginBottom: 2 }}>
                  {selectedBusiness.name}
                </Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                  <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
                  <Typography variant="caption" color={colors.primary} style={{ marginLeft: 3, fontWeight: '600' }}>
                    {selectedBusiness.category}
                  </Typography>
                </View>
                {selectedBusiness.description ? (
                  <Typography variant="body2" color={colors.textMuted} numberOfLines={2}>
                    {selectedBusiness.description}
                  </Typography>
                ) : null}
                {selectedBusiness.address ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                    <Typography variant="caption" color={colors.textMuted} numberOfLines={1} style={{ marginLeft: 3, flex: 1 }}>
                      {selectedBusiness.address}
                    </Typography>
                  </View>
                ) : null}

                <Pressable
                  style={styles.viewBtn}
                  onPress={() => router.push(`/negocio/${selectedBusiness.id}`)}
                >
                  <Typography variant="body2" style={{ color: '#fff', fontWeight: 'bold' }}>
                    Ver Tienda
                  </Typography>
                  <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 4 }} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Loading indicator */}
      {loadingData && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Typography variant="caption" color={colors.primary} style={{ marginLeft: spacing.s }}>
            Buscando comercios...
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // TOP
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.m,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.s,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: Platform.OS === 'ios' ? spacing.s : spacing.xs,
    ...shadows.floating,
    gap: spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  profileBtn: {
    backgroundColor: colors.surface,
    padding: spacing.s,
    borderRadius: radius.round,
    ...shadows.medium,
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
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
  chipCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
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
  resultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.m,
    paddingVertical: 5,
    borderRadius: radius.round,
    marginTop: spacing.s,
    ...shadows.soft,
  },
  loadingBadge: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.round,
    ...shadows.medium,
  },

  // BOTTOM SHEET
  bottomSheet: {
    position: 'absolute',
    bottom: 70,
    left: spacing.m,
    right: spacing.m,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.floating,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.s,
    marginBottom: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.s,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
    gap: 4,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
  },
  cardContent: {
    flexDirection: 'row',
    padding: spacing.m,
    gap: spacing.m,
  },
  cardImageWrap: {
    borderRadius: radius.l,
    overflow: 'hidden',
  },
  cardImage: {
    width: 85,
    height: 85,
    borderRadius: radius.l,
  },
  cardImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    alignSelf: 'flex-start',
    marginTop: spacing.s,
    ...shadows.soft,
  },
});
