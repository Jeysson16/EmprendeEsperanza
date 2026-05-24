import { Tabs } from 'expo-router';
import { colors } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      headerShown: false,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: 4,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{ 
          title: 'Explora',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="mis-pedidos" 
        options={{ 
          title: 'Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}
