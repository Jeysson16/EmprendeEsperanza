import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Typography } from '@/shared/components/Typography';
import { Input } from '@/shared/components/Input';
import { Card } from '@/shared/components/Card';
import CustomMap from '@/shared/components/Map';
import { getBusinesses, Business, seedInitialData } from '@/core/services/firebaseService';
import { colors, spacing, radius, shadows, layout } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { useAuth } from '@/core/context/AuthContext';

export default function MapScreen() {
  const router = useRouter();
  const { user, userProfile, logoutUser } = useAuth();
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [businesses, setBusinesses] = useState<(Business & { distance?: number })[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        fetchBusinesses(); // Fetch without location
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);
      fetchBusinesses(coords.latitude, coords.longitude);
    })();
  }, []);

  const fetchBusinesses = async (lat?: number, lng?: number) => {
    const data = await getBusinesses(lat, lng);
    setBusinesses(data);
  };

  const handleSeed = async () => {
    if (location) {
      await seedInitialData(location.latitude, location.longitude);
      fetchBusinesses(location.latitude, location.longitude);
      alert('Datos de prueba generados!');
    }
  };

  const handleProfilePress = () => {
    if (!user) {
      router.push('/(auth)/login');
    } else {
      Alert.alert(
        `Sesión activa: ${userProfile?.displayName || 'Usuario'}`,
        `Rol: ${userProfile?.role === 'emprendedor' ? 'Emprendedor' : 'Cliente'}\nCorreo: ${user.email}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          ...(userProfile?.role === 'emprendedor' ? [
            { text: 'Ir al Panel de Control', onPress: () => router.push('/(emprendedor)/dashboard') }
          ] : []),
          { text: 'Cerrar Sesión', style: 'destructive', onPress: async () => {
            try {
              await logoutUser();
              router.replace('/');
            } catch (err) {
              console.error(err);
            }
          }}
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* MAPA A PANTALLA COMPLETA */}
      <View style={StyleSheet.absoluteFill}>
        <CustomMap 
          businesses={businesses} 
          userLocation={location} 
          onSelectBusiness={setSelectedBusiness} 
        />
      </View>

      {/* OVERLAYS FLOTANTES */}
      <View style={[styles.floatingContainer, layout.getContainerStyle()]}>
        
        {/* Top Search Bar */}
        <View style={styles.topOverlay}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={colors.primary} />
              <Input 
                placeholder="Buscar en La Esperanza..." 
                style={styles.searchInput} 
              />
              <Ionicons name="options" size={20} color={colors.textMuted} />
            </View>
            
            <Pressable style={styles.profileBtn} onPress={handleProfilePress}>
              <Ionicons 
                name={user ? "person-circle" : "log-in-outline"} 
                size={28} 
                color={user ? colors.primary : colors.text} 
              />
            </Pressable>
          </View>
          
          <View style={styles.chipsRow}>
            <View style={[styles.chip, styles.chipActive]}>
              <Ionicons name="grid" size={16} color={colors.surface} />
              <Typography variant="body2" style={styles.chipTextActive}>Todos</Typography>
            </View>
            <View style={styles.chip}>
              <Ionicons name="storefront" size={16} color={colors.primary} />
              <Typography variant="body2" color={colors.text}>Bodegas</Typography>
            </View>
          </View>

          {/* Temporal: Botón para sembrar datos reales en Firebase */}
          {businesses.length === 0 && (
            <Button title="Generar Datos de Prueba (Seed)" onPress={handleSeed} style={{marginTop: 10}} />
          )}
        </View>

        {/* Bottom Selected Business Card */}
        {selectedBusiness && (
          <View style={styles.bottomOverlay}>
            <Card style={styles.selectedCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardBadge}>
                  <Typography variant="caption" color={colors.success} style={{fontWeight: 'bold'}}>ABIERTO</Typography>
                </View>
                {selectedBusiness.distance !== undefined && (
                  <View style={styles.distanceBadge}>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                    <Typography variant="caption" style={{marginLeft: 4}}>
                      A {(selectedBusiness.distance * 1000).toFixed(0)}m
                    </Typography>
                  </View>
                )}
                <Ionicons name="close" size={20} color={colors.textMuted} style={styles.closeIcon} onPress={() => setSelectedBusiness(null)} />
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Typography variant="h3">{selectedBusiness.name}</Typography>
                  <Typography variant="body2" numberOfLines={1}>{selectedBusiness.description}</Typography>
                  <Button 
                    title="Ver Perfil" 
                    onPress={() => router.push(`/negocio/${selectedBusiness.id}`)} 
                    style={{ marginTop: spacing.s, paddingVertical: spacing.xs }}
                  />
                </View>
              </View>
            </Card>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  floatingContainer: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
    justifyContent: 'space-between',
  },
  topOverlay: {
    padding: spacing.l,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    pointerEvents: 'box-none',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    paddingHorizontal: spacing.l,
    ...shadows.medium,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: spacing.m,
  },
  profileBtn: {
    marginLeft: spacing.s,
    backgroundColor: colors.surface,
    padding: spacing.s,
    borderRadius: radius.round,
    ...shadows.medium,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: spacing.m,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.round,
    marginRight: spacing.s,
    ...shadows.soft,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipTextActive: {
    color: colors.surface,
    marginLeft: spacing.s,
    fontWeight: 'bold',
  },
  bottomOverlay: {
    padding: spacing.l,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  cardBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: radius.s,
    marginRight: spacing.s,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeIcon: {
    marginLeft: 'auto',
  },
  cardContent: {
    flexDirection: 'row',
  },
  cardImage: {
    width: 80,
    height: 80,
    backgroundColor: '#EBEBEB',
    borderRadius: radius.m,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.m,
    justifyContent: 'center',
  }
});

