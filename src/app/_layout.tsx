import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/core/context/AuthContext';
import { colors } from '@/core/theme';

function RootLayoutContent() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const segs = segments as any;
    const firstSegment = segs[0];
    const inAuthGroup = firstSegment === '(auth)';
    const inEmprendedorGroup = firstSegment === '(emprendedor)';
    const inTabsGroup = firstSegment === '(tabs)';
    const isWelcomeScreen = segs.length === 0 || firstSegment === 'index' || firstSegment === '';

    if (!user) {
      // Redirigir a bienvenida si el usuario no logueado intenta entrar al dashboard del emprendedor
      if (inEmprendedorGroup || inTabsGroup) {
        router.replace('/');
      }
    } else {
      // Si hay usuario autenticado y perfil cargado
      if (userProfile) {
        if (userProfile.role === 'emprendedor') {
          // El emprendedor debe ir siempre a su dashboard
          if (inAuthGroup || inTabsGroup || isWelcomeScreen) {
            router.replace('/(emprendedor)/dashboard');
          }
        } else if (userProfile.role === 'cliente') {
          // El cliente logueado debe ir a explorar la app
          if (inAuthGroup || inEmprendedorGroup || isWelcomeScreen) {
            router.replace('/(tabs)');
          }
        }
      }
    }
  }, [user, userProfile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="negocio/[id]" />
      <Stack.Screen name="(emprendedor)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
