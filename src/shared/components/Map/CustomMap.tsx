import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Business } from '@/core/services/firebaseService';
import { colors } from '@/core/theme';

interface CustomMapProps {
  businesses: Business[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectBusiness: (b: Business) => void;
}

export const CustomMap: React.FC<CustomMapProps> = ({ businesses, userLocation, onSelectBusiness }) => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || -8.0777,
          longitude: userLocation?.longitude || -79.0354, // La Esperanza aprox
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {businesses.map((b) => (
          <Marker
            key={b.id || b.name}
            coordinate={{ latitude: b.location.latitude, longitude: b.location.longitude }}
            onPress={() => onSelectBusiness(b)}
            pinColor={colors.primary}
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
