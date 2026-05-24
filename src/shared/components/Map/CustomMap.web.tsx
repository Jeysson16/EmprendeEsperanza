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
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 3px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .marker-pin svg {
      width: 16px;
      height: 16px;
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
    map.setView([-8.0777, -79.0354], 14);

    var markers = {};
    var userMarker = null;

    function getCategoryIconSvg(category) {
      var cat = (category || '').toLowerCase();
      if (cat.includes('carniceria') || cat.includes('carnicería') || cat.includes('carne')) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14c0 4 3 7 7 7 5 0 9-4 9-9 0-5-4-9-9-9-4 0-7 3-7 7 0 1 .2 2 .6 3z"></path><path d="M10 10c0 2 1.5 3.5 3.5 3.5S17 12 17 10 15.5 6.5 13.5 6.5 10 8 10 10z"></path></svg>';
      }
      if (cat.includes('panaderia') || cat.includes('panadería') || cat.includes('pan')) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9c0-2.2 2.2-4 5-4s5 1.8 5 4v10H7V9z"></path><path d="M9 12v-1"></path><path d="M12 12v-2"></path><path d="M15 12v-1"></path></svg>';
      }
      if (cat.includes('bodega') || cat.includes('tienda') || cat.includes('comercio')) {
        // Shopping bag SVG
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>';
      }
      if (cat.includes('restaurant') || cat.includes('restaurante') || cat.includes('comida')) {
        // Utensils SVG
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v4M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3zM12 22V11M18 22V17"></path></svg>';
      }
      if (cat.includes('farmacia') || cat.includes('botica') || cat.includes('salud')) {
        // Medical cross SVG
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"></path></svg>';
      }
      // Default: storefront/house
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';
    }

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
            getCategoryIconSvg(b.category) +
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
