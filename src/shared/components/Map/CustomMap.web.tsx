import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Business } from '@/core/services/firebaseService';
import { colors, radius, spacing, shadows } from '@/core/theme';
import { Typography } from '../Typography';
import { Ionicons } from '@expo/vector-icons';

interface CustomMapProps {
  businesses: Business[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectBusiness: (b: Business) => void;
}

// Convert lat/lng offset to approximate pixel position within the iframe viewport
function latLngToPixel(
  lat: number, lng: number,
  centerLat: number, centerLng: number,
  containerW: number, containerH: number,
  bboxOffset: number
): { x: number; y: number } {
  const x = ((lng - (centerLng - bboxOffset)) / (bboxOffset * 2)) * containerW;
  const y = (1 - (lat - (centerLat - bboxOffset)) / (bboxOffset * 2)) * containerH;
  return { x, y };
}

export const CustomMap: React.FC<CustomMapProps> = ({ businesses, userLocation, onSelectBusiness }) => {
  const centerLat = userLocation?.latitude || -8.0777;
  const centerLng = userLocation?.longitude || -79.0354;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const bboxOffset = 0.012;
  const bbox = `${centerLng - bboxOffset},${centerLat - bboxOffset},${centerLng + bboxOffset},${centerLat + bboxOffset}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
    >
      {/* OpenStreetMap iframe */}
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0, display: 'block' }}
        src={osmUrl}
        onLoad={() => setMapLoaded(true)}
      />

      {/* Loading overlay while OSM iframe loads */}
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
        const { x, y } = latLngToPixel(
          userLocation.latitude, userLocation.longitude,
          centerLat, centerLng,
          containerSize.width, containerSize.height,
          bboxOffset
        );
        if (x < 0 || x > containerSize.width || y < 0 || y > containerSize.height) return null;
        return (
          <View key="user-location" style={[styles.userMarker, { left: x - 14, top: y - 14 }]}>
            <View style={styles.userMarkerPulse} />
            <View style={styles.userMarkerDot} />
          </View>
        );
      })()}

      {/* Business markers over iframe */}
      {mapLoaded && containerSize.width > 0 && businesses.map((b) => {
        const { x, y } = latLngToPixel(
          b.location.latitude, b.location.longitude,
          centerLat, centerLng,
          containerSize.width, containerSize.height,
          bboxOffset
        );
        if (x < 0 || x > containerSize.width || y < 0 || y > containerSize.height) return null;
        return (
          <Pressable
            key={b.id || b.name}
            style={[styles.businessMarker, { left: x - 20, top: y - 36 }]}
            onPress={() => onSelectBusiness(b)}
          >
            <View style={[styles.markerBubble, { backgroundColor: b.isOpen ? colors.primary : colors.textMuted }]}>
              <Ionicons name="storefront" size={14} color="#fff" />
            </View>
            <View style={[styles.markerTail, { borderTopColor: b.isOpen ? colors.primary : colors.textMuted }]} />
            <View style={[styles.markerLabel]}>
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
  container: { flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  userMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '30',
    borderWidth: 1,
    borderColor: colors.primary + '60',
  },
  userMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: '#fff',
    ...shadows.soft,
  },
  businessMarker: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 15,
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  markerLabel: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    maxWidth: 120,
    ...shadows.soft,
  },
  markerLabelText: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 10,
  },
});

export default CustomMap;
