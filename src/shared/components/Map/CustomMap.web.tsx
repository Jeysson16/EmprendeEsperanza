import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Business } from '@/core/services/firebaseService';
import { colors, radius, spacing, shadows } from '@/core/theme';
import { Typography } from '../Typography';
import { Ionicons } from '@expo/vector-icons';

export interface MapRegion {
  latitude: number;
  longitude: number;
  bboxOffset?: number; // degrees, default 0.012
}

interface CustomMapProps {
  businesses: Business[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectBusiness: (b: Business) => void;
  region?: MapRegion | null;
}

/**
 * Convert a lat/lng to pixel coordinates within the current iframe viewport.
 * Returns null if the point is outside the visible bbox.
 */
function latLngToPixel(
  lat: number, lng: number,
  centerLat: number, centerLng: number,
  containerW: number, containerH: number,
  halfLat: number, halfLng: number
): { x: number; y: number } | null {
  const minLat = centerLat - halfLat;
  const maxLat = centerLat + halfLat;
  const minLng = centerLng - halfLng;
  const maxLng = centerLng + halfLng;

  if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) return null;

  const x = ((lng - minLng) / (maxLng - minLng)) * containerW;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * containerH;
  return { x, y };
}

export const CustomMap: React.FC<CustomMapProps> = ({
  businesses, userLocation, onSelectBusiness, region
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [iframeSrc, setIframeSrc] = useState('');

  // Derive center from region prop, or fall back to userLocation / La Esperanza
  const centerLat = region?.latitude ?? userLocation?.latitude ?? -8.0777;
  const centerLng = region?.longitude ?? userLocation?.longitude ?? -79.0354;

  // When focusing on specific businesses, use tighter zoom
  const bboxOffset = region?.bboxOffset ?? 0.012;

  // OSM bbox: west, south, east, north
  const west  = centerLng - bboxOffset;
  const south = centerLat - bboxOffset;
  const east  = centerLng + bboxOffset;
  const north = centerLat + bboxOffset;
  const bbox = `${west},${south},${east},${north}`;

  const newSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  useEffect(() => {
    // Reset loaded state & update src when center/zoom changes
    setMapLoaded(false);
    setIframeSrc(newSrc);
  }, [centerLat, centerLng, bboxOffset]);

  // half-extents for pixel projection
  const halfLat = bboxOffset;
  const halfLng = bboxOffset;

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
    >
      {/* OpenStreetMap iframe */}
      {iframeSrc ? (
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block' }}
          src={iframeSrc}
          onLoad={() => setMapLoaded(true)}
        />
      ) : null}

      {/* Loading overlay */}
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body2" color={colors.primary} style={{ marginTop: spacing.s }}>
            Cargando mapa...
          </Typography>
        </View>
      )}

      {/* User location marker */}
      {mapLoaded && containerSize.width > 0 && userLocation && (() => {
        const pos = latLngToPixel(
          userLocation.latitude, userLocation.longitude,
          centerLat, centerLng,
          containerSize.width, containerSize.height,
          halfLat, halfLng
        );
        if (!pos) return null;
        return (
          <View key="user-loc" style={[styles.userMarker, { left: pos.x - 14, top: pos.y - 14 }]}>
            <View style={styles.userMarkerPulse} />
            <View style={styles.userMarkerDot} />
          </View>
        );
      })()}

      {/* Business markers */}
      {mapLoaded && containerSize.width > 0 && businesses.map(b => {
        const pos = latLngToPixel(
          b.location.latitude, b.location.longitude,
          centerLat, centerLng,
          containerSize.width, containerSize.height,
          halfLat, halfLng
        );
        if (!pos) return null;
        const markerColor = b.isOpen ? colors.primary : '#6B7280';

        return (
          <Pressable
            key={b.id || b.name}
            style={({ pressed }) => [
              styles.businessMarker,
              { left: pos.x - 20, top: pos.y - 44 },
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => onSelectBusiness(b)}
          >
            {/* Pin bubble */}
            <View style={[styles.markerBubble, { backgroundColor: markerColor }]}>
              <Ionicons name="storefront" size={15} color="#fff" />
            </View>
            {/* Pin tail */}
            <View style={[styles.markerTail, { borderTopColor: markerColor }]} />
            {/* Name label */}
            <View style={styles.markerLabel}>
              <Typography variant="caption" style={styles.markerLabelText} numberOfLines={1}>
                {b.name}
              </Typography>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // User location blue dot with pulse ring
  userMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  } as any,
  userMarkerPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '30',
    borderWidth: 1.5,
    borderColor: colors.primary + '70',
  },
  userMarkerDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: '#fff',
    ...shadows.soft,
  },
  // Business map pin
  businessMarker: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 15,
  },
  markerBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...shadows.medium,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  markerLabel: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 3,
    maxWidth: 130,
    ...shadows.soft,
  },
  markerLabelText: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 10,
  },
});

export default CustomMap;
