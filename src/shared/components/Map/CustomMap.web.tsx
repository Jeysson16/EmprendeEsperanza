import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Business } from '@/core/services/firebaseService';
import { colors, radius, spacing, shadows } from '@/core/theme';
import { Typography } from '../Typography';

interface CustomMapProps {
  businesses: Business[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectBusiness: (b: Business) => void;
}

export const CustomMap: React.FC<CustomMapProps> = ({ businesses, userLocation, onSelectBusiness }) => {
  const centerLat = userLocation?.latitude || -8.0777;
  const centerLng = userLocation?.longitude || -79.0354;

  const bboxOffset = 0.01;
  const bbox = `${centerLng - bboxOffset},${centerLat - bboxOffset},${centerLng + bboxOffset},${centerLat + bboxOffset}`;
  
  // Usamos iframe de OpenStreetMap para web nativa para evitar problemas de dependencias (react-leaflet crash)
  return (
    <View style={styles.container}>
      <iframe 
        width="100%" 
        height="100%" 
        style={{ border: 0 }}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${centerLat},${centerLng}`}
      />
      {/* Overlay de marcadores web simulados para la lista de negocios */}
      <View style={styles.overlayList}>
        {businesses.map((b) => (
          <Pressable key={b.id || b.name} style={styles.webMarker} onPress={() => onSelectBusiness(b)}>
            <Typography variant="body2" style={{ fontWeight: 'bold' }}>{b.name}</Typography>
            {b.distance && <Typography variant="caption">{b.distance.toFixed(1)} km</Typography>}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%', position: 'relative' },
  overlayList: {
    position: 'absolute',
    right: spacing.m,
    top: spacing.m,
    width: 200,
    maxHeight: '80%',
    overflow: 'hidden'
  },
  webMarker: {
    backgroundColor: colors.surface,
    padding: spacing.s,
    marginBottom: spacing.s,
    borderRadius: radius.m,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.soft,
  }
});

export default CustomMap;
