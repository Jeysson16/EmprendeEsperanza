import React, { useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { colors } from '@/core/theme';

interface MapPickerProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onSelectLocation: (location: { latitude: number; longitude: number }) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLatitude,
  initialLongitude,
  onSelectLocation,
}) => {
  const mapRef = useRef<MapView>(null);
  
  const defaultLat = -8.0777;
  const defaultLng = -79.0354;
  
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: initialLatitude ?? defaultLat,
    longitude: initialLongitude ?? defaultLng,
  });

  const handleMapPress = (e: MapPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
    onSelectLocation(coords);
  };

  const handleMarkerDragEnd = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
    onSelectLocation(coords);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={selectedLocation}
          draggable
          onDragEnd={handleMarkerDragEnd}
          pinColor={colors.primary}
          title="Ubicación de tu Negocio"
          description="Arrastra este pin o presiona en el mapa para moverlo"
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});

export default MapPicker;
