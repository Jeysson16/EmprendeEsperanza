import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Business } from '@/core/services/firebaseService';
import { colors } from '@/core/theme';

// Keep MapRegion interface in sync with CustomMap.web.tsx
export interface MapRegion {
  latitude: number;
  longitude: number;
  bboxOffset?: number;
}

interface CustomMapProps {
  businesses: Business[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectBusiness: (b: Business) => void;
  region?: MapRegion | null;
}

export const CustomMap: React.FC<CustomMapProps> = ({
  businesses, userLocation, onSelectBusiness, region
}) => {
  const mapRef = useRef<MapView>(null);

  const centerLat = region?.latitude ?? userLocation?.latitude ?? -8.0777;
  const centerLng = region?.longitude ?? userLocation?.longitude ?? -79.0354;
  const delta = (region?.bboxOffset ?? 0.015) * 2;

  // Animate to new region when it changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }, 500);
    }
  }, [centerLat, centerLng, delta]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {businesses.map((b) => (
          <Marker
            key={b.id || b.name}
            coordinate={{ latitude: b.location.latitude, longitude: b.location.longitude }}
            onPress={() => onSelectBusiness(b)}
            pinColor={b.isOpen ? colors.primary : '#6B7280'}
            title={b.name}
            description={b.isOpen ? `Abierto · ${b.openingHours?.open ?? ''}–${b.openingHours?.close ?? ''}` : 'Cerrado'}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});

export default CustomMap;
