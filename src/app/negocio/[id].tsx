import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Share, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '@/shared/components/Typography';
import { Card } from '@/shared/components/Card';
import { colors, spacing, radius, layout, shadows } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { getBusinessById, Business } from '@/core/services/firebaseService';

export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    (async () => {
      // Intenta cargar de firebase
      const data = await getBusinessById(id as string);
      if (data) {
        setBusiness(data);
      } else {
        // Fallback mockup por si el id no existe aún
        setBusiness({
          id: id as string,
          name: 'Bodega Doña Lucha',
          category: 'Abarrotes',
          description: 'Tu bodega de confianza desde hace 15 años. Ofrecemos abarrotes, frutas frescas, verduras del día y productos de limpieza. ¡Todo lo que necesitas sin salir del barrio!',
          location: { latitude: 0, longitude: 0 },
          address: 'Av. Esperanza 452, Sector 2',
          phone: '+51 987 654 321',
          isOpen: true,
          imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000'
        });
      }
    })();
  }, [id]);

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      } else {
        await Share.share({ message: `Mira este excelente comercio en La Esperanza: https://emprendeesperanza.com/negocio/${id}` });
      }
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  if (!business) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} bounces={false}>
      <ImageBackground 
        source={{ uri: business.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000' }} 
        style={styles.coverImage}
      >
        <View style={styles.overlay}>
          <View style={[layout.getContainerStyle(), styles.topBar]}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Typography variant="h2" color={colors.surface} style={{ fontWeight: 'bold' }}>{business.name.toUpperCase()}</Typography>
            <Pressable style={styles.iconBtn} onPress={handleShare}>
              <Ionicons name="share-social" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </ImageBackground>

      <View style={[layout.getContainerStyle(), styles.contentWrapper]}>
        
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Typography variant="caption" color={colors.primaryDark} style={{fontWeight:'bold'}}>{business.category.toUpperCase()}</Typography>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={[styles.dot, {backgroundColor: business.isOpen ? colors.success : colors.error}]} />
            <Typography variant="caption" color={business.isOpen ? colors.success : colors.error} style={{fontWeight:'bold'}}>
              {business.isOpen ? 'Abierto ahora' : 'Cerrado'}
            </Typography>
          </View>
        </View>

        <Typography variant="h1" style={styles.businessName}>{business.name}</Typography>
        
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <View style={{marginLeft: spacing.s}}>
            <Typography variant="body2">{business.address}</Typography>
            <Typography variant="caption">A 200m de ti</Typography>
          </View>
        </View>

        <View style={styles.divider} />

        <Typography variant="h2" style={styles.sectionTitle}>Sobre nosotros</Typography>
        <Typography variant="body1" style={styles.description}>
          {business.description}
        </Typography>

        <Card style={styles.scheduleCard} noPadding>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleIconBox}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
            </View>
            <View style={{marginLeft: spacing.m, flex: 1}}>
              <Typography variant="h3">Horario de atención</Typography>
              <Typography variant="body2">Hoy: 08:00 AM - 09:00 PM</Typography>
            </View>
            <Ionicons name="chevron-down" size={24} color={colors.textMuted} />
          </View>
        </Card>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  coverImage: {
    height: 300,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.5)', // Oscurecer la imagen
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.xl,
    paddingHorizontal: spacing.l,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.round,
    padding: spacing.s,
    ...shadows.soft,
  },
  contentWrapper: {
    backgroundColor: colors.surface,
    marginTop: -40,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 500,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  badge: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
    borderRadius: radius.round,
    marginRight: spacing.m,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 6
  },
  businessName: {
    marginBottom: spacing.m,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.m,
  },
  description: {
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  scheduleCard: {
    backgroundColor: colors.background,
    borderWidth: 0,
    borderRadius: radius.m,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
  },
  scheduleIconBox: {
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.s,
    borderRadius: radius.round,
  }
});
