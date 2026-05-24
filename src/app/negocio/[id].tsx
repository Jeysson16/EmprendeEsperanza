import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Share, ImageBackground, Image, Pressable, Linking, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '@/shared/components/Typography';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, spacing, radius, layout, shadows } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/core/context/AuthContext';
import { 
  getBusinessById, 
  getReviewsByBusinessId, 
  createReview, 
  createOrder, 
  Business, 
  Product, 
  Review, 
  OrderItem 
} from '@/core/services/firebaseService';

export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estado del Carrito Local
  const [cart, setCart] = useState<{ [productName: string]: { product: Product; quantity: number } }>({});

  // Modales
  const [isOrderModalVisible, setOrderModalVisible] = useState(false);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);

  // Campos para realizar el Pedido
  const [clientName, setClientName] = useState('');

  // Campos para escribir Reseña
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const biz = await getBusinessById(id as string);
      if (biz) {
        setBusiness(biz);
      }
      const revList = await getReviewsByBusinessId(id as string);
      setReviews(revList);
    } catch (err) {
      console.error('Error al cargar perfil del negocio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (userProfile?.displayName) {
      setClientName(userProfile.displayName);
      setReviewerName(userProfile.displayName);
    }
  }, [id, userProfile]);

  const updateCartQty = (product: Product, change: number) => {
    if (!product.name) return;
    setCart(prev => {
      const current = prev[product.name];
      const newQty = (current?.quantity || 0) + change;
      
      if (newQty <= 0) {
        const { [product.name]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [product.name]: { product, quantity: newQty }
      };
    });
  };

  const getCartTotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  };

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

  const handleSendWhatsAppOrder = async () => {
    if (!clientName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa tu nombre completo para realizar el pedido.');
      return;
    }
    if (!business) return;

    setSubmitting(true);
    try {
      const cartItems: OrderItem[] = Object.values(cart).map(item => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      const total = getCartTotal();

      // 1. Guardar orden en Firestore
      await createOrder({
        businessId: business.id!,
        businessName: business.name,
        clientId: user?.uid || 'guest',
        clientName: clientName.trim(),
        items: cartItems,
        total,
        status: 'pendiente'
      });

      // 2. Formatear mensaje para WhatsApp
      let message = `¡Hola, ${business.name}! Mi nombre es ${clientName.trim()}. Quisiera realizar el siguiente pedido a través de EmprendeEsperanza:\n\n`;
      cartItems.forEach(item => {
        message += `• ${item.quantity}x ${item.name} (S/ ${item.price.toFixed(2)} c/u) → S/ ${(item.price * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*Total a pagar: S/ ${total.toFixed(2)}*\n\n¡Muchas gracias!`;

      // 3. Limpiar teléfono de la tienda y abrir WhatsApp
      const cleanedPhone = business.phone.replace(/[^0-9]/g, '');
      const whatsappNumber = cleanedPhone.startsWith('51') ? cleanedPhone : `51${cleanedPhone}`; // Default Perú

      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      setOrderModalVisible(false);
      setCart({});
      
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        Linking.openURL(url);
      }

      Alert.alert('Pedido registrado', '¡Tu pedido fue registrado! Redirigiendo a WhatsApp del local...');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo procesar tu pedido. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishReview = async () => {
    if (!reviewerName.trim() || !reviewComment.trim()) {
      Alert.alert('Campos vacíos', 'Por favor ingresa tu nombre y un comentario.');
      return;
    }
    if (!business?.id) return;

    setSubmitting(true);
    try {
      await createReview({
        businessId: business.id,
        clientId: user?.uid || 'guest',
        clientName: reviewerName.trim(),
        rating,
        comment: reviewComment.trim()
      });

      Alert.alert('Reseña guardada', '¡Muchas gracias por calificar este comercio!');
      setReviewComment('');
      setReviewModalVisible(false);
      
      // Recargar reseñas
      const revList = await getReviewsByBusinessId(business.id);
      setReviews(revList);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la reseña.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typography variant="body1" style={{ marginTop: spacing.m }}>Cargando información del comercio...</Typography>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.loadingContainer}>
        <Typography variant="h3" color={colors.error}>Comercio no encontrado</Typography>
        <Button title="Volver al Inicio" onPress={() => router.replace('/(tabs)')} style={{ marginTop: spacing.m }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
            <View style={{marginLeft: spacing.s, flex: 1}}>
              <Typography variant="body2">{business.address}</Typography>
              <Typography variant="caption">Teléfono: {business.phone}</Typography>
            </View>
          </View>

          <Typography variant="body1" style={styles.description}>
            {business.description || 'Sin descripción disponible.'}
          </Typography>

          <View style={styles.divider} />

          {/* CATÁLOGO DE PRODUCTOS */}
          <Typography variant="h2" style={styles.sectionTitle}>Nuestro Catálogo</Typography>
          
          {!business.products || business.products.length === 0 ? (
            <Card style={{ padding: spacing.l, alignItems: 'center', marginBottom: spacing.xl }}>
              <Ionicons name="gift-outline" size={40} color={colors.textMuted} />
              <Typography variant="body2" color={colors.textMuted} style={{ marginTop: spacing.s, textAlign: 'center' }}>
                Este comercio aún no ha subido productos a su catálogo.
              </Typography>
            </Card>
          ) : (
            <View style={{ marginBottom: spacing.xl }}>
              {business.products.map((prod) => {
                const cartItem = cart[prod.name];
                const qty = cartItem?.quantity || 0;
                
                return (
                  <View key={prod.name} style={styles.productRow}>
                    {prod.imageUrl ? (
                      <Image source={{ uri: prod.imageUrl }} style={styles.productImage} />
                    ) : (
                      <View style={[styles.productImage, styles.productImagePlaceholder]}>
                        <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: spacing.m }}>
                      <Typography variant="body1" style={{ fontWeight: 'bold' }}>{prod.name}</Typography>
                      {prod.description ? (
                        <Typography variant="body2" color={colors.textMuted} numberOfLines={1}>{prod.description}</Typography>
                      ) : null}
                      <Typography variant="body2" color={colors.primary} style={{ fontWeight: '600', marginTop: 2 }}>
                        S/ {prod.price.toFixed(2)}
                      </Typography>
                    </View>
                    
                    {/* Selector de cantidad para el carrito */}
                    {qty > 0 ? (
                      <View style={styles.quantityContainer}>
                        <Pressable style={styles.qtyBtn} onPress={() => updateCartQty(prod, -1)}>
                          <Typography variant="h3" color={colors.primary} style={{ lineHeight: 20 }}>-</Typography>
                        </Pressable>
                        <Typography variant="body1" style={{ marginHorizontal: spacing.s, fontWeight: 'bold' }}>{qty}</Typography>
                        <Pressable style={styles.qtyBtn} onPress={() => updateCartQty(prod, 1)}>
                          <Typography variant="h3" color={colors.primary} style={{ lineHeight: 20 }}>+</Typography>
                        </Pressable>
                      </View>
                    ) : (
                      <Button 
                        title="Agregar" 
                        variant="outline" 
                        onPress={() => updateCartQty(prod, 1)}
                        style={{ paddingVertical: spacing.xs, paddingHorizontal: spacing.m }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.divider} />

          {/* SECCIÓN DE RESEÑAS Y COMENTARIOS */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.m }}>
            <Typography variant="h2">Reseñas y Opiniones</Typography>
            <Button 
              title="Calificar" 
              variant="ghost" 
              onPress={() => setReviewModalVisible(true)}
              style={{ paddingVertical: spacing.xs }}
            />
          </View>

          {reviews.length === 0 ? (
            <Card style={{ padding: spacing.l, alignItems: 'center', marginBottom: spacing.xl }}>
              <Ionicons name="chatbox-ellipses-outline" size={32} color={colors.textMuted} />
              <Typography variant="body2" color={colors.textMuted} style={{ marginTop: spacing.s, textAlign: 'center' }}>
                Este comercio aún no tiene calificaciones. ¡Sé el primero en calificarlo!
              </Typography>
            </Card>
          ) : (
            reviews.map((rev) => (
              <Card key={rev.id || rev.comment} style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <Typography variant="body1" style={{ fontWeight: 'bold' }}>{rev.clientName}</Typography>
                  <View style={{ flexDirection: 'row' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons 
                        key={star} 
                        name={star <= rev.rating ? "star" : "star-outline"} 
                        size={14} 
                        color="#F59E0B" 
                      />
                    ))}
                  </View>
                </View>
                <Typography variant="body2" color={colors.text}>{rev.comment}</Typography>
                <Typography variant="caption" style={{ marginTop: spacing.xs, fontSize: 10 }}>
                  {rev.createdAt instanceof Date ? rev.createdAt.toLocaleDateString() : 'Hace poco'}
                </Typography>
              </Card>
            ))
          )}

        </View>
      </ScrollView>

      {/* BARRA FLOTANTE CHECKOUT CARRITO */}
      {getCartItemCount() > 0 && (
        <View style={styles.checkoutBarContainer}>
          <View style={[layout.getContainerStyle(), styles.checkoutBar]}>
            <View>
              <Typography variant="caption" color={colors.surface}>Tu Pedido ({getCartItemCount()} items)</Typography>
              <Typography variant="h2" color={colors.surface} style={{ fontWeight: 'bold' }}>
                S/ {getCartTotal().toFixed(2)}
              </Typography>
            </View>
            <Pressable 
              style={styles.checkoutBtn} 
              onPress={() => setOrderModalVisible(true)}
            >
              <Ionicons name="logo-whatsapp" size={20} color={colors.primary} style={{ marginRight: spacing.s }} />
              <Typography variant="body1" style={{ color: colors.primary, fontWeight: 'bold' }}>
                Pedir
              </Typography>
            </Pressable>
          </View>
        </View>
      )}

      {/* MODAL CHECKOUT - PEDIDO */}
      <Modal visible={isOrderModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.m }}>
              <Typography variant="h3">Confirmar Pedido</Typography>
              <Ionicons name="close" size={24} color={colors.text} onPress={() => setOrderModalVisible(false)} />
            </View>

            <Typography variant="body2" color={colors.textMuted} style={{ marginBottom: spacing.m }}>
              El pedido se enviará por WhatsApp directamente a la tienda y quedará registrado en tu historial.
            </Typography>

            <Input 
              label="Tu Nombre Completo *"
              placeholder="Ej. Juan Pérez"
              value={clientName}
              onChangeText={setClientName}
              editable={!submitting}
              style={{ marginBottom: spacing.l }}
            />

            <View style={{ flexDirection: 'row' }}>
              <Button 
                title="Cancelar" 
                variant="outline" 
                onPress={() => setOrderModalVisible(false)} 
                style={{ flex: 1, marginRight: spacing.s }}
                disabled={submitting}
              />
              <Button 
                title={submitting ? "Enviando..." : "Confirmar y Enviar"} 
                onPress={handleSendWhatsAppOrder} 
                style={{ flex: 1 }}
                disabled={submitting || !clientName.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ESCRIBIR RESEÑA */}
      <Modal visible={isReviewModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.m }}>
              <Typography variant="h3">Escribir Reseña</Typography>
              <Ionicons name="close" size={24} color={colors.text} onPress={() => setReviewModalVisible(false)} />
            </View>

            <Input 
              label="Tu Nombre / Apodo *"
              placeholder="Ej. Vecino Lucho"
              value={reviewerName}
              onChangeText={setReviewerName}
              editable={!submitting}
              style={{ marginBottom: spacing.m }}
            />

            {/* Selector de calificación estrellas */}
            <Typography variant="body2" style={{ fontWeight: 'bold', marginBottom: spacing.xs }}>Calificación *</Typography>
            <View style={styles.starSelectorRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)} disabled={submitting}>
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={32} 
                    color="#F59E0B" 
                    style={{ marginRight: spacing.s }}
                  />
                </Pressable>
              ))}
            </View>

            <Typography variant="body2" style={{ fontWeight: 'bold', marginBottom: spacing.xs, marginTop: spacing.m }}>Comentario *</Typography>
            <TextInput 
              placeholder="Escribe tu opinión sobre este local..."
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              editable={!submitting}
              style={styles.textArea}
            />

            <View style={{ flexDirection: 'row', marginTop: spacing.l }}>
              <Button 
                title="Cancelar" 
                variant="outline" 
                onPress={() => setReviewModalVisible(false)} 
                style={{ flex: 1, marginRight: spacing.s }}
                disabled={submitting}
              />
              <Button 
                title={submitting ? "Publicando..." : "Publicar"} 
                onPress={handlePublishReview} 
                style={{ flex: 1 }}
                disabled={submitting || !reviewerName.trim() || !reviewComment.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 150 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  coverImage: {
    height: 300,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
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
    marginBottom: spacing.m,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.s,
    backgroundColor: colors.surface,
  },
  qtyBtn: {
    padding: spacing.xs,
    width: 28,
    alignItems: 'center',
  },
  reviewCard: {
    marginBottom: spacing.m,
    backgroundColor: '#F9FAFB',
    borderWidth: 0,
  },
  checkoutBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.l,
    zIndex: 100,
  },
  checkoutBar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: 16,
    ...shadows.floating,
  },
  checkoutBtn: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.round,
    ...shadows.soft,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.l,
    maxHeight: '80%',
  },
  starSelectorRow: {
    flexDirection: 'row',
    marginVertical: spacing.s,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    padding: spacing.m,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text,
  }
});
