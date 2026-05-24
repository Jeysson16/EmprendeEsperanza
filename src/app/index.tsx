import { useAuth } from '@/core/context/AuthContext';
import { colors, layout, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Si ya está cargando el estado de autenticación, mostramos un indicador de carga
  if (loading) {
    return (
      <View style={[styles.scroll, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../../assets/images/plaza_armas.jpg')} 
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.15 }}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={layout.getContainerStyle()}>
          <View style={styles.header}>
            <Image 
              source={require('../../assets/images/logo_esperanza.png')} 
              style={styles.logo}
              contentFit="contain"
            />
            <Typography variant="h1" color={colors.primary} align="center">EmprendeEsperanza</Typography>
            <Typography variant="body1" align="center" style={{ marginTop: spacing.s, maxWidth: 450, alignSelf: 'center', color: colors.textMuted }}>
              Descubre y apoya los comercios locales de La Esperanza. La mejor plataforma para conectar clientes y emprendedores del barrio.
            </Typography>
          </View>
          
          <Card style={styles.card}>
            <Typography variant="h3" align="center" style={{ marginBottom: spacing.xl, fontWeight: 'bold' }}>
              ¿Cómo deseas ingresar?
            </Typography>
            
            <Button 
              title="Explorar como Invitado" 
              onPress={() => router.push('/(tabs)')} 
              style={{ marginBottom: spacing.m }}
            />
            <Button 
              title="Iniciar Sesión / Registrarse" 
              variant="outline"
              onPress={() => router.push('/(auth)/login')} 
            />
          </Card>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: spacing.m,
  },
  card: {
    padding: spacing.xxl,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // slightly transparent card for the background to peek through
  }
});
