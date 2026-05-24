import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, ScrollView, ActivityIndicator, Platform, Pressable, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/shared/components/Typography';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { colors, spacing, radius, shadows, layout } from '@/core/theme';
import { useAuth } from '@/core/context/AuthContext';
import { getOrdersByClientId, Order } from '@/core/services/firebaseService';

const STATUS_CONFIG = {
  pendiente:   { label: 'PENDIENTE',  bg: '#FFF8E1', text: '#F59E0B', icon: 'time-outline' as const },
  completado:  { label: 'COMPLETADO', bg: '#E8F5E9', text: '#10B981', icon: 'checkmark-circle-outline' as const },
  cancelado:   { label: 'CANCELADO',  bg: '#FEEBEE', text: '#EF4444', icon: 'close-circle-outline' as const },
};

export default function MisPedidosScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await getOrdersByClientId(user.uid);
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
        <Typography variant="h3" style={{ marginTop: spacing.m, textAlign: 'center' }}>
          Inicia sesión para ver tus pedidos
        </Typography>
        <Button
          title="Iniciar Sesión"
          style={{ marginTop: spacing.l, paddingHorizontal: spacing.xl }}
          onPress={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <View style={layout.getContainerStyle()}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Typography variant="h1">Mis Pedidos</Typography>
            <Typography variant="body2" color={colors.textMuted}>
              Hola, {userProfile?.displayName || 'cliente'} 👋
            </Typography>
          </View>
          <Pressable onPress={onRefresh} style={styles.refreshBtn}>
            <Ionicons name="refresh-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Typography variant="body2" color={colors.textMuted} style={{ marginTop: spacing.m }}>
              Cargando tus pedidos...
            </Typography>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bag-outline" size={56} color={colors.primary} />
            </View>
            <Typography variant="h3" style={{ marginTop: spacing.l, textAlign: 'center' }}>
              Sin pedidos aún
            </Typography>
            <Typography variant="body1" color={colors.textMuted} style={{ textAlign: 'center', marginTop: spacing.s, maxWidth: 280 }}>
              Explora los comercios del barrio y realiza tu primer pedido
            </Typography>
            <Button
              title="Explorar Comercios"
              style={{ marginTop: spacing.xl }}
              onPress={() => router.push('/(tabs)')}
            />
          </View>
        ) : (
          <View>
            <Typography variant="body2" color={colors.textMuted} style={{ marginBottom: spacing.m }}>
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} en total
            </Typography>
            {orders.map((order) => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pendiente;
              const dateStr = order.createdAt instanceof Date
                ? order.createdAt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Hace poco';

              return (
                <Card key={order.id} style={styles.orderCard} noPadding>
                  {/* Header del pedido */}
                  <View style={styles.orderHeader}>
                    <Pressable
                      style={styles.businessLink}
                      onPress={() => {
                        // Navegar al negocio si tenemos el id
                        if (order.businessId) router.push(`/negocio/${order.businessId}`);
                      }}
                    >
                      <Ionicons name="storefront-outline" size={18} color={colors.primary} />
                      <Typography variant="body1" style={styles.businessName} numberOfLines={1}>
                        {order.businessName}
                      </Typography>
                      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                    </Pressable>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                      <Ionicons name={sc.icon} size={12} color={sc.text} />
                      <Typography variant="caption" style={[styles.statusText, { color: sc.text }]}>
                        {sc.label}
                      </Typography>
                    </View>
                  </View>

                  {/* Items del pedido */}
                  <View style={styles.itemsSection}>
                    {order.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <View style={styles.itemQtyBadge}>
                          <Typography variant="caption" style={styles.itemQtyText}>{item.quantity}</Typography>
                        </View>
                        <Typography variant="body2" style={{ flex: 1, marginLeft: spacing.s }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color={colors.primary} style={{ fontWeight: '600' }}>
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </View>
                    ))}
                  </View>

                  {/* Footer del pedido */}
                  <View style={styles.orderFooter}>
                    <View style={styles.footerLeft}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                      <Typography variant="caption" color={colors.textMuted} style={{ marginLeft: 4 }}>
                        {dateStr}
                      </Typography>
                    </View>
                    <View style={styles.totalRow}>
                      <Typography variant="body2" color={colors.textMuted}>Total: </Typography>
                      <Typography variant="body1" color={colors.primary} style={{ fontWeight: 'bold' }}>
                        S/ {order.total.toFixed(2)}
                      </Typography>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.l,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCard: {
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  businessLink: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  businessName: {
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: 3,
    borderRadius: radius.s,
    gap: 4,
    marginLeft: spacing.s,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  itemsSection: {
    padding: spacing.m,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  itemQtyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQtyText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 11,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
