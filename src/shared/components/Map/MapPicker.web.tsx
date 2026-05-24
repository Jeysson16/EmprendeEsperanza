import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '@/core/theme';
import { Typography } from '../Typography';

interface MapPickerProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onSelectLocation: (location: { latitude: number; longitude: number }) => void;
}

const leafletPickerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .custom-marker-icon {
      background: none;
      border: none;
    }
    .marker-pin-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 70px;
    }
    .marker-pin {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 3px 8px rgba(0,0,0,0.2);
      background-color: #0CB083;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .marker-pin svg {
      width: 14px;
      height: 14px;
    }
    .marker-tail {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 7px solid #0CB083;
      margin-top: -1px;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,0.15));
    }
    .marker-label {
      background: rgba(255, 255, 255, 0.95);
      color: #1F2937;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-weight: 700;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 5px;
      margin-top: 3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      white-space: nowrap;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    var marker = null;

    var pinHtml = '<div class="marker-pin-container">' +
      '<div class="marker-pin">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>' +
          '<circle cx="12" cy="10" r="3"></circle>' +
        '</svg>' +
      '</div>' +
      '<div class="marker-tail"></div>' +
      '<div class="marker-label">Tu Local</div>' +
    '</div>';

    var markerIcon = L.divIcon({
      className: 'custom-marker-icon',
      html: pinHtml,
      iconSize: [80, 70],
      iconAnchor: [40, 48]
    });

    function setLocation(lat, lng, centerMap) {
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], {
          icon: markerIcon,
          draggable: true
        }).addTo(map);

        marker.on('dragend', function() {
          var position = marker.getLatLng();
          sendLocation(position.lat, position.lng);
        });
      }
      if (centerMap) {
        map.setView([lat, lng], 15);
      }
    }

    function sendLocation(lat, lng) {
      window.parent.postMessage({
        type: 'PICK_LOCATION',
        latitude: lat,
        longitude: lng
      }, '*');
    }

    // Map click sets location
    map.on('click', function(e) {
      setLocation(e.latlng.lat, e.latlng.lng, false);
      sendLocation(e.latlng.lat, e.latlng.lng);
    });

    // Listen to messages from React Native web
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'INITIALIZE_PICKER') {
        setLocation(event.data.latitude, event.data.longitude, true);
      }
    });

    window.parent.postMessage({ type: 'PICKER_READY' }, '*');
  </script>
</body>
</html>
`;

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLatitude,
  initialLongitude,
  onSelectLocation,
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const defaultLat = -8.0777;
  const defaultLng = -79.0354;

  const targetLat = initialLatitude ?? defaultLat;
  const targetLng = initialLongitude ?? defaultLng;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PICKER_READY') {
        setIsReady(true);
        setMapLoaded(true);
      } else if (event.data?.type === 'PICK_LOCATION') {
        onSelectLocation({
          latitude: event.data.latitude,
          longitude: event.data.longitude,
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectLocation]);

  useEffect(() => {
    if (isReady && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'INITIALIZE_PICKER',
        latitude: targetLat,
        longitude: targetLng,
      }, '*');
    }
  }, [isReady, targetLat, targetLng]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        style={{ border: 0, display: 'block' }}
        srcdoc={leafletPickerHtml}
      />
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body2" color={colors.primary} style={{ marginTop: spacing.s }}>
            Cargando selector de ubicación...
          </Typography>
        </View>
      )}
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
});

export default MapPicker;
