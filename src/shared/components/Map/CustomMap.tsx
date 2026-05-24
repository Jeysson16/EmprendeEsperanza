import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Business } from '@/core/services/firebaseService';
import { colors } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';

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

const getCategoryIconName = (category: string): any => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('carniceria') || cat.includes('carnicería') || cat.includes('carne')) {
    return 'cut-outline'; // Cleaver / knife-like representation
  }
  if (cat.includes('panaderia') || cat.includes('panadería') || cat.includes('pan')) {
    return 'cafe-outline'; // Coffee/bakery representing Panadería
  }
  if (cat.includes('bodega') || cat.includes('tienda') || cat.includes('comercio')) {
    return 'basket-outline'; // Grocery basket
  }
  if (cat.includes('restaurant') || cat.includes('restaurante') || cat.includes('comida')) {
    return 'restaurant-outline'; // Fork and knife
  }
  if (cat.includes('farmacia') || cat.includes('botica') || cat.includes('salud')) {
    return 'medkit-outline'; // Pharmacy/first-aid cross
  }
  return 'storefront-outline'; // Default storefront
};

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
            title={b.name}
            description={b.isOpen ? `Abierto · ${b.openingHours?.open ?? ''}–${b.openingHours?.close ?? ''}` : 'Cerrado'}
          >
            <View style={[styles.markerContainer, { backgroundColor: b.isOpen ? colors.primary : '#6B7280' }]}>
              <Ionicons name={getCategoryIconName(b.category)} size={14} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default CustomMap;
