import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Business } from '@/core/services/firebaseService';
import { colors, spacing } from '@/core/theme';
import { Typography } from '../Typography';

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

const leafletHtml = `
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
      border-top: 7px solid white;
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
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 78px;
      text-align: center;
    }
    .pulse-dot {
      width: 12px;
      height: 12px;
      background-color: #0CB083;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .pulse-ring {
      position: absolute;
      width: 26px;
      height: 26px;
      border: 1.5px solid rgba(12, 176, 131, 0.7);
      border-radius: 50%;
      background-color: rgba(12, 176, 131, 0.15);
      animation: pulse 1.8s infinite ease-out;
      margin-left: -7px;
      margin-top: -7px;
      box-sizing: border-box;
    }
    @keyframes pulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
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

    var markers = {};
    var userMarker = null;

    function updateMap(data) {
      var center = data.center;
      var zoom = data.zoom;
      var userLoc = data.userLoc;
      var businessList = data.businessList;

      if (center) {
        map.setView([center.lat, center.lng], zoom || 15);
      }

      if (userLoc) {
        var userIcon = L.divIcon({
          className: 'custom-user-icon',
          html: '<div style="position: relative; width: 26px; height: 26px;"><div class="pulse-ring"></div><div class="pulse-dot"></div></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        if (userMarker) {
          userMarker.setLatLng([userLoc.latitude, userLoc.longitude]);
        } else {
          userMarker = L.marker([userLoc.latitude, userLoc.longitude], { icon: userIcon }).addTo(map);
        }
      } else if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
      }

      // Remove deleted businesses
      var activeIds = {};
      businessList.forEach(function(b) {
        activeIds[b.id || b.name] = true;
      });

      for (var id in markers) {
        if (!activeIds[id]) {
          map.removeLayer(markers[id]);
          delete markers[id];
        }
      }

      // Add/update businesses
      businessList.forEach(function(b) {
        var id = b.id || b.name;
        var color = b.isOpen ? '#0CB083' : '#6B7280';
        
        var iconHtml = '<div class="marker-pin-container">' +
          '<div class="marker-pin" style="background-color: ' + color + ';">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>' +
              '<polyline points="9 22 9 12 15 12 15 22"></polyline>' +
            '</svg>' +
          '</div>' +
          '<div class="marker-tail" style="border-top-color: ' + color + ';"></div>' +
          '<div class="marker-label">' + b.name + '</div>' +
        '</div>';

        var customIcon = L.divIcon({
          className: 'custom-marker-icon',
          html: iconHtml,
          iconSize: [80, 70],
          iconAnchor: [40, 48]
        });

        if (markers[id]) {
          markers[id].setLatLng([b.location.latitude, b.location.longitude]);
          markers[id].setIcon(customIcon);
        } else {
          var m = L.marker([b.location.latitude, b.location.longitude], { icon: customIcon }).addTo(map);
          m.on('click', function() {
            window.parent.postMessage({ type: 'SELECT_BUSINESS', business: b }, '*');
          });
          markers[id] = m;
        }
      });
    }

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'UPDATE_MAP_DATA') {
        updateMap(event.data);
      }
    });

    window.parent.postMessage({ type: 'MAP_READY' }, '*');
  </script>
</body>
</html>
`;

export const CustomMap: React.FC<CustomMapProps> = ({
  businesses, userLocation, onSelectBusiness, region
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const centerLat = region?.latitude ?? userLocation?.latitude ?? -8.0777;
  const centerLng = region?.longitude ?? userLocation?.longitude ?? -79.0354;
  const bboxOffset = region?.bboxOffset ?? 0.012;

  // Map bboxOffset to leaflet zoom level
  let zoom = 14;
  if (region?.bboxOffset) {
    if (region.bboxOffset <= 0.003) zoom = 17;
    else if (region.bboxOffset <= 0.006) zoom = 16;
    else if (region.bboxOffset <= 0.012) zoom = 15;
    else if (region.bboxOffset <= 0.024) zoom = 14;
    else zoom = 13;
  }

  const sendUpdate = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_MAP_DATA',
        center: { lat: centerLat, lng: centerLng },
        zoom: zoom,
        userLoc: userLocation,
        businessList: businesses
      }, '*');
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MAP_READY') {
        setIsReady(true);
        setMapLoaded(true);
      } else if (event.data?.type === 'SELECT_BUSINESS') {
        onSelectBusiness(event.data.business);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectBusiness]);

  useEffect(() => {
    if (isReady) {
      sendUpdate();
    }
  }, [isReady, businesses, centerLat, centerLng, zoom, userLocation]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        style={{ border: 0, display: 'block' }}
        srcDoc={leafletHtml}
      />

      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="body2" color={colors.primary} style={{ marginTop: spacing.s }}>
            Cargando mapa...
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

export default CustomMap;
