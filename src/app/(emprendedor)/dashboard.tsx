import { useAuth } from '@/core/context/AuthContext';
import {
  Business,
  Category,
  createBusiness,
  createCategory,
  deleteCategory,
  getBusinessByOwnerId,
  getCategories,
  getOrdersByBusinessId,
  isBusinessOpen,
  Order,
  Product,
  updateBusiness,
  updateCategory,
  updateOrderStatus,
  uploadImage
} from '@/core/services/firebaseService';
import { colors, layout, radius, shadows, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { MapPicker } from '@/shared/components/Map';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function MaintainerDashboard() {
  const router = useRouter();
  const { user, logoutUser, userProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'perfil' | 'catalogo' | 'pedidos'>('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Datos del Negocio en Firestore
  const [business, setBusiness] = useState<Business | null>(null);

  // Campos del Formulario (Negocio)
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Horario de atención
  const [openHour, setOpenHour] = useState('08:00');
  const [closeHour, setCloseHour] = useState('20:00');

  // Coordenadas del local
  const [locLat, setLocLat] = useState('');
  const [locLng, setLocLng] = useState('');
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Pedidos del negocio
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Categorías de Firestore
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  // Campos del Formulario (Categorías CRUD)
  const [isCatCrudModalVisible, setCatCrudModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catCrudName, setCatCrudName] = useState('');
  const [catCrudImg, setCatCrudImg] = useState('');
  
  // Estado para Modal de Nuevo Producto
  const [isProductModalVisible, setProductModalVisible] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImg, setNewProductImg] = useState('');

  // Cargar pedidos
  const loadOrders = async (bizId: string) => {
    setLoadingOrders(true);
    try {
      const data = await getOrdersByBusinessId(bizId);
      setOrders(data);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Cargar categorías y datos del negocio
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
      
      const b = await getBusinessByOwnerId(user.uid);
      if (b) {
        setBusiness(b);
        setBusinessName(b.name || '');
        setAddress(b.address || '');
        setPhone(b.phone || '');
        setDescription(b.description || '');
        setImageUrl(b.imageUrl || '');
        setGalleryImages(b.images || []);
        setOpenHour(b.openingHours?.open || '08:00');
        setCloseHour(b.openingHours?.close || '20:00');
        setLocLat(b.location?.latitude?.toString() || '');
        setLocLng(b.location?.longitude?.toString() || '');
        
        const matchedCat = cats.find(c => c.name === b.category);
        if (matchedCat) {
          setSelectedCategory(matchedCat);
        } else if (b.category) {
          setSelectedCategory({ name: b.category, imageUrl: '' });
        }

        // Cargar pedidos de la tienda
        await loadOrders(b.id!);
      }
    } catch (error) {
      console.error('Error al cargar datos del panel:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de tu negocio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Helper para abrir la galería y subir la foto a Storage
  const handleSelectAndUploadImage = async (storagePath: string, onUploadSuccess: (url: string) => void) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permisos requeridos', 'Se requiere acceso a la galería para poder subir fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setUploadingImage(true);
      
      const downloadUrl = await uploadImage(uri, storagePath);
      onUploadSuccess(downloadUrl);
      Alert.alert('Éxito', '¡Imagen cargada correctamente en Firebase Storage!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un fallo al subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!businessName || !address || !selectedCategory || !phone) {
      Alert.alert('Campos incompletos', 'Por favor llena los campos obligatorios: Nombre, Categoría, Dirección y Teléfono.');
      return;
    }

    const lat = parseFloat(locLat);
    const lng = parseFloat(locLng);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Coordenadas inválidas', 'Por favor ingresa coordenadas válidas o usa el botón de ubicación actual.');
      return;
    }

    // Validate opening hours format HH:MM
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(openHour) || !timeRegex.test(closeHour)) {
      Alert.alert('Formato de hora inválido', 'Ingresa las horas en formato HH:MM, por ejemplo 08:00 o 21:30');
      return;
    }

    setSaving(true);
    try {
      const businessData: Omit<Business, 'id'> = {
        name: businessName,
        category: selectedCategory.name,
        address,
        phone,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1473169643883-f8ed53bc87e9?auto=format&fit=crop&q=80&w=600',
        images: galleryImages,
        isOpen: false, // will be computed dynamically
        openingHours: { open: openHour, close: closeHour },
        ownerId: user.uid,
        location: { latitude: lat, longitude: lng },
        products: business?.products || []
      };
      // Compute live isOpen
      businessData.isOpen = isBusinessOpen(businessData as Business);

      if (business?.id) {
        await updateBusiness(business.id, businessData);
        setBusiness({ id: business.id, ...businessData });
      } else {
        const newId = await createBusiness(businessData);
        setBusiness({ id: newId, ...businessData });
      }
      Alert.alert('Éxito', '¡Perfil del negocio guardado correctamente!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un error al guardar los cambios del negocio.');
    } finally {
      setSaving(false);
    }
  };

  // Agregar producto al catálogo
  const handleAddProduct = async () => {
    if (!business?.id) {
      Alert.alert('Negocio requerido', 'Debes guardar primero el perfil de tu negocio antes de agregar productos.');
      return;
    }
    if (!newProductName || !newProductPrice) {
      Alert.alert('Campos obligatorios', 'Por favor ingresa al menos el nombre y el precio del producto.');
      return;
    }

    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Precio inválido', 'El precio debe ser un número positivo.');
      return;
    }

    setSaving(true);
    try {
      const newProduct: Product = {
        name: newProductName,
        description: newProductDesc,
        price: priceNum,
        imageUrl: newProductImg || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300'
      };

      const updatedProducts = [...(business.products || []), newProduct];
      await updateBusiness(business.id!, { products: updatedProducts });
      
      const updatedBusiness = { ...business, products: updatedProducts };
      setBusiness(updatedBusiness);
      
      setProductModalVisible(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductDesc('');
      setNewProductImg('');
      
      Alert.alert('Éxito', '¡Producto agregado al catálogo!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (prodName: string) => {
    if (!business?.id) return;

    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de que deseas eliminar "${prodName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const updatedProducts = (business.products || []).filter(p => p.name !== prodName);
              await updateBusiness(business.id!, { products: updatedProducts });
              
              setBusiness({ ...business, products: updatedProducts });
              Alert.alert('Éxito', 'Producto eliminado.');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar el producto.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  // Cambiar el estado de un pedido (Post-venta)
  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
      setSaving(true);
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      Alert.alert('Éxito', `Pedido marcado como ${status === 'completado' ? 'Completado' : 'Cancelado'}.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido.');
    } finally {
      setSaving(false);
    }
  };

  // Guardar Categoría CRUD (Crear o Editar)
  const handleSaveCatCrud = async () => {
    if (!catCrudName || !catCrudImg) {
      Alert.alert('Campos incompletos', 'Ingresa el nombre y selecciona una imagen para la categoría.');
      return;
    }

    setSaving(true);
    try {
      const catData = {
        name: catCrudName,
        imageUrl: catCrudImg
      };

      if (editingCategory?.id) {
        await updateCategory(editingCategory.id, catData);
        Alert.alert('Éxito', 'Categoría modificada correctamente.');
      } else {
        await createCategory(catData);
        Alert.alert('Éxito', 'Categoría creada correctamente.');
      }

      setCatCrudModalVisible(false);
      setEditingCategory(null);
      setCatCrudName('');
      setCatCrudImg('');
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la categoría.');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar Categoría CRUD
  const handleDeleteCategory = async (id: string, catName: string) => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Deseas eliminar la categoría "${catName}"? Esto podría afectar a los negocios asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteCategory(id);
              Alert.alert('Éxito', 'Categoría eliminada.');
              loadData();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar la categoría.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typography variant="body1" style={{ marginTop: spacing.m }}>Cargando datos del panel...</Typography>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={layout.getContainerStyle()}>
        
        {/* Encabezado Premium */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="storefront" size={32} color={colors.primary} />
            <Typography variant="h1" style={{ marginLeft: spacing.s, flex: 1 }} numberOfLines={1}>
              {business ? 'Mi Comercio' : 'Registra tu Local'}
            </Typography>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Typography variant="body2" color={colors.error} style={{ marginLeft: 4, fontWeight: 'bold' }}>Salir</Typography>
          </Pressable>
        </View>

        {/* Datos de Bienvenida */}
        <View style={styles.welcomeCard}>
          <Typography variant="body1" style={{ fontWeight: 'bold' }}>
            Hola, {userProfile?.displayName || 'Emprendedor'}!
          </Typography>
          <Typography variant="body2" color={colors.textMuted}>
            Administra tu negocio local y da seguimiento post-venta a los pedidos de tus clientes.
          </Typography>
        </View>

        {/* Pestañas de Navegación del Panel (Pedidos Integrada) */}
        <View style={styles.tabsRow}>
          <Button 
            title="Perfil" 
            variant={activeTab === 'perfil' ? 'primary' : 'ghost'} 
            onPress={() => setActiveTab('perfil')}
            style={styles.tabBtn}
          />
          <Button 
            title="Catálogo" 
            variant={activeTab === 'catalogo' ? 'primary' : 'ghost'} 
            onPress={() => setActiveTab('catalogo')}
            style={styles.tabBtn}
          />
          <Button 
            title="Pedidos" 
            variant={activeTab === 'pedidos' ? 'primary' : 'ghost'} 
            onPress={() => {
              setActiveTab('pedidos');
              if (business?.id) loadOrders(business.id);
            }}
            style={styles.tabBtn}
          />
        </View>

        <Card>
          {activeTab === 'perfil' ? (
            <View>
              <Typography variant="h3" style={{ marginBottom: spacing.l }}>Información del Local</Typography>
              
              <Input 
                label="Nombre del Negocio *"
                placeholder="Ej. Bodega Don Pepe" 
                style={styles.input} 
                value={businessName}
                onChangeText={setBusinessName}
                editable={!saving}
              />

              <Typography variant="body2" style={{ marginBottom: spacing.xs, fontWeight: 'bold' }}>Categoría *</Typography>
              <Pressable style={styles.selectBtn} onPress={() => setCategoryModalVisible(true)} disabled={saving}>
                <Typography variant="body1" color={selectedCategory ? colors.text : colors.textMuted}>
                  {selectedCategory ? selectedCategory.name : 'Selecciona una categoría...'}
                </Typography>
                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
              </Pressable>

              <Input 
                label="Dirección del Local *"
                placeholder="Ej. Av. Principal 123, Sector 2" 
                style={styles.input} 
                value={address}
                onChangeText={setAddress}
                editable={!saving}
              />

              <Input 
                label="Teléfono de Contacto *"
                placeholder="Ej. +51 987 654 321" 
                style={styles.input} 
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!saving}
              />

              {/* Foto de Portada con Subida Real a Storage */}
              <Typography variant="body2" style={{ marginBottom: spacing.xs, fontWeight: 'bold' }}>Foto de Portada del Local</Typography>
              <View style={styles.imageSelectorRow}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                  </View>
                )}
                
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: spacing.m }} />
                ) : (
                  <Button 
                    title="Subir la imagen" 
                    variant="outline" 
                    onPress={() => handleSelectAndUploadImage(
                      `businesses/${user?.uid || 'unknown'}/cover.jpg`, 
                      setImageUrl
                    )} 
                    style={{ flex: 1, marginLeft: spacing.m }}
                  />
                )}
              </View>

              {/* Galería de Fotos del Local */}
              <Typography variant="body2" style={{ marginBottom: spacing.xs, fontWeight: 'bold', marginTop: spacing.s }}>
                Galería de Fotos del Local
              </Typography>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.galleryScrollView}
                contentContainerStyle={styles.galleryContent}
              >
                {galleryImages.map((img, idx) => (
                  <View key={img + idx} style={styles.galleryThumbContainer}>
                    <Image source={{ uri: img }} style={styles.galleryThumb} />
                    <Pressable 
                      style={styles.galleryThumbDelete}
                      onPress={() => {
                        setGalleryImages(prev => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                ))}
                
                {uploadingImage ? (
                  <View style={[styles.galleryThumbPlaceholder, { justifyContent: 'center' }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <Pressable 
                    style={styles.galleryThumbPlaceholder}
                    onPress={() => {
                      const timestamp = Date.now();
                      handleSelectAndUploadImage(
                        `businesses/${user?.uid || 'unknown'}/gallery_${timestamp}.jpg`, 
                        (url) => setGalleryImages(prev => [...prev, url])
                      );
                    }}
                  >
                    <Ionicons name="add" size={28} color={colors.primary} />
                    <Typography variant="caption" color={colors.primary} style={{ fontWeight: '600' }}>
                      Añadir
                    </Typography>
                  </Pressable>
                )}
              </ScrollView>

              <Input 
                label="Descripción Corta del Negocio"
                placeholder="¿Qué ofreces a tus clientes?" 
                style={styles.input} 
                multiline 
                numberOfLines={3} 
                value={description}
                onChangeText={setDescription}
                editable={!saving}
              />

              {/* ── Horario de Atención ── */}
              <Typography variant="body2" style={{ marginBottom: spacing.xs, fontWeight: 'bold', marginTop: spacing.s }}>
                Horario de Atención *
              </Typography>
              <View style={styles.hoursRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Apertura (HH:MM)"
                    placeholder="08:00"
                    style={styles.input}
                    value={openHour}
                    onChangeText={setOpenHour}
                    keyboardType="numbers-and-punctuation"
                    editable={!saving}
                  />
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.textMuted} style={{ marginHorizontal: spacing.s, marginTop: 36 }} />
                <View style={{ flex: 1 }}>
                  <Input
                    label="Cierre (HH:MM)"
                    placeholder="20:00"
                    style={styles.input}
                    value={closeHour}
                    onChangeText={setCloseHour}
                    keyboardType="numbers-and-punctuation"
                    editable={!saving}
                  />
                </View>
              </View>
              <View style={styles.hoursPreview}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Typography variant="caption" color={colors.primary} style={{ marginLeft: 4 }}>
                  Estado actual basado en el horario:{' '}
                  {(() => {
                    if (!openHour || !closeHour) return 'Sin horario';
                    const now = new Date();
                    const [oh, om] = openHour.split(':').map(Number);
                    const [ch, cm] = closeHour.split(':').map(Number);
                    const nowM = now.getHours() * 60 + now.getMinutes();
                    const openM = oh * 60 + om;
                    const closeM = ch * 60 + cm;
                    const open = closeM <= openM
                      ? (nowM >= openM || nowM < closeM)
                      : (nowM >= openM && nowM < closeM);
                    return open ? '🟢 Abierto ahora' : '🔴 Cerrado ahora';
                  })()}
                </Typography>
              </View>

              {/* ── Ubicación del Local ── */}
              <Typography variant="body2" style={{ fontWeight: 'bold', marginTop: spacing.m, marginBottom: spacing.xs }}>
                Ubicación en el Mapa *
              </Typography>

              {locLat && locLng ? (
                <View style={styles.coordPreviewCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="location" size={18} color={colors.primary} />
                    <Typography variant="body2" style={{ fontWeight: '700', color: colors.primary }}>
                      Ubicación configurada
                    </Typography>
                  </View>
                  <Typography variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                    Latitud: {parseFloat(locLat).toFixed(6)} · Longitud: {parseFloat(locLng).toFixed(6)}
                  </Typography>
                </View>
              ) : (
                <View style={[styles.coordPreviewCard, { borderColor: colors.error, backgroundColor: '#FDF2F2' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="alert-circle" size={18} color={colors.error} />
                    <Typography variant="body2" style={{ fontWeight: '700', color: colors.error }}>
                      Sin ubicación asignada
                    </Typography>
                  </View>
                  <Typography variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                    Debes seleccionar las coordenadas en el mapa o usar tu GPS para continuar.
                  </Typography>
                </View>
              )}

              <View style={styles.mapActionsRow}>
                <Button 
                  title="Seleccionar en Mapa"
                  onPress={() => {
                    setTempLocation({
                      latitude: parseFloat(locLat) || -8.0777,
                      longitude: parseFloat(locLng) || -79.0354,
                    });
                    setIsMapPickerVisible(true);
                  }}
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="map" size={18} color="#fff" />
                    <Typography variant="body2" style={{ color: '#fff', fontWeight: 'bold' }}>Mapa</Typography>
                  </View>
                </Button>

                <Button
                  title="Usar GPS"
                  variant="outline"
                  onPress={async () => {
                    try {
                      const { status } = await Location.requestForegroundPermissionsAsync();
                      if (status !== 'granted') {
                        Alert.alert('Permiso denegado', 'Activa los permisos de ubicación para usar esta función.');
                        return;
                      }
                      const loc = await Location.getCurrentPositionAsync({});
                      setLocLat(loc.coords.latitude.toFixed(6));
                      setLocLng(loc.coords.longitude.toFixed(6));
                      Alert.alert('Ubicación obtenida', `Lat: ${loc.coords.latitude.toFixed(5)}\nLng: ${loc.coords.longitude.toFixed(5)}`);
                    } catch {
                      Alert.alert('Error', 'No se pudo obtener la ubicación.');
                    }
                  }}
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="locate" size={18} color={colors.primary} />
                    <Typography variant="body2" style={{ color: colors.primary, fontWeight: 'bold' }}>GPS</Typography>
                  </View>
                </Button>
              </View>
              
              {saving ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.m }} />
              ) : (
                <Button 
                  title={business ? "Guardar Cambios" : "Registrar Mi Negocio"} 
                  style={{ marginTop: spacing.l }} 
                  onPress={handleSaveProfile} 
                />
              )}
            </View>
          ) : activeTab === 'catalogo' ? (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l }}>
                <Typography variant="h3">Mis Productos</Typography>
                <Button 
                  title="+ Nuevo Producto" 
                  variant="outline" 
                  onPress={() => {
                    if (!business?.id) {
                      Alert.alert('Registra tu negocio primero', 'Debes rellenar y guardar la información del negocio en la pestaña Perfil antes de poder gestionar el catálogo.');
                    } else {
                      setProductModalVisible(true);
                    }
                  }}
                  disabled={saving}
                />
              </View>

              {!business?.products || business.products.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
                  <Typography variant="body1" color={colors.textMuted} style={{ marginTop: spacing.s, textAlign: 'center' }}>
                    No tienes productos agregados a tu catálogo. ¡Presiona + Nuevo Producto para agregar el primero!
                  </Typography>
                </View>
              ) : (
                business.products.map((prod, idx) => (
                  <View key={prod.name + idx} style={styles.productRow}>
                    <View style={styles.productImgContainer}>
                      {prod.imageUrl ? (
                        <Image source={{ uri: prod.imageUrl }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                      ) : (
                        <View style={styles.productImgPlaceholder}>
                          <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.m }}>
                      <Typography variant="body1" style={{ fontWeight: 'bold' }}>{prod.name}</Typography>
                      {prod.description ? (
                        <Typography variant="body2" color={colors.textMuted} numberOfLines={1}>{prod.description}</Typography>
                      ) : null}
                      <Typography variant="body2" color={colors.primary} style={{ fontWeight: '600', marginTop: 2 }}>
                        S/ {prod.price.toFixed(2)}
                      </Typography>
                    </View>
                    <Pressable 
                      style={styles.actionIcon} 
                      onPress={() => handleDeleteProduct(prod.name)}
                      disabled={saving}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          ) : activeTab === 'pedidos' ? (
            // PESTAÑA: PEDIDOS RECIBIDOS (Venta y Post-venta)
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l }}>
                <Typography variant="h3">Pedidos Recibidos</Typography>
                <Pressable onPress={() => business?.id && loadOrders(business.id)}>
                  <Ionicons name="refresh-outline" size={24} color={colors.primary} />
                </Pressable>
              </View>

              {loadingOrders ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
              ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                  <Typography variant="body1" color={colors.textMuted} style={{ marginTop: spacing.s, textAlign: 'center' }}>
                    No has recibido ningún pedido aún.
                  </Typography>
                </View>
              ) : (
                orders.map((ord) => (
                  <Card key={ord.id} style={styles.orderCard} noPadding>
                    <View style={styles.orderHeader}>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body1" style={{ fontWeight: 'bold' }}>{ord.clientName}</Typography>
                        <Typography variant="caption">
                          {ord.createdAt instanceof Date ? ord.createdAt.toLocaleString() : 'Hace poco'}
                        </Typography>
                      </View>
                      
                      <View style={[
                        styles.statusBadge, 
                        ord.status === 'completado' && styles.statusCompleted,
                        ord.status === 'cancelado' && styles.statusCancelled
                      ]}>
                        <Typography variant="caption" style={{ 
                          fontWeight: 'bold',
                          color: ord.status === 'pendiente' ? colors.warning : (ord.status === 'completado' ? colors.success : colors.error)
                        }}>
                          {ord.status.toUpperCase()}
                        </Typography>
                      </View>
                    </View>

                    <View style={styles.orderDetails}>
                      {ord.items.map((item, idx) => (
                        <Typography key={idx} variant="body2" color={colors.text}>
                          • {item.quantity}x {item.name} (S/ {item.price.toFixed(2)} c/u)
                        </Typography>
                      ))}
                      
                      <View style={styles.orderTotalRow}>
                        <Typography variant="body1" style={{ fontWeight: 'bold' }}>Total:</Typography>
                        <Typography variant="body1" color={colors.primary} style={{ fontWeight: 'bold' }}>
                          S/ {ord.total.toFixed(2)}
                        </Typography>
                      </View>
                    </View>

                    {ord.status === 'pendiente' && (
                      <View style={styles.orderActions}>
                        <Button 
                          title="Completar" 
                          variant="primary"
                          onPress={() => handleUpdateStatus(ord.id!, 'completado')}
                          style={{ flex: 1, marginRight: spacing.s, paddingVertical: spacing.xs }}
                          disabled={saving}
                        />
                        <Button 
                          title="Cancelar" 
                          variant="outline"
                          onPress={() => handleUpdateStatus(ord.id!, 'cancelado')}
                          style={{ flex: 1, paddingVertical: spacing.xs }}
                          disabled={saving}
                        />
                      </View>
                    )}
                  </Card>
                ))
              )}
            </View>
          ) : null}
        </Card>

      </View>

      {/* MODAL DE SELECCIÓN DE CATEGORÍAS (EN PERFIL) */}
      <Modal visible={isCategoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.m }}>
              <Typography variant="h3">Selecciona una Categoría</Typography>
              <Ionicons name="close" size={24} color={colors.text} onPress={() => setCategoryModalVisible(false)} />
            </View>
            <ScrollView>
              {categories.map(cat => (
                <Pressable 
                  key={cat.id || cat.name} 
                  style={styles.categoryItem} 
                  onPress={() => {
                    setSelectedCategory(cat);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Typography variant="body1">{cat.name}</Typography>
                  {selectedCategory?.name === cat.name && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CREACIÓN/EDICIÓN DE PRODUCTO */}
      <Modal visible={isProductModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.l }}>
              <Typography variant="h3">Agregar Nuevo Producto</Typography>
              <Ionicons name="close" size={24} color={colors.text} onPress={() => setProductModalVisible(false)} />
            </View>
            
            <ScrollView style={{ maxHeight: 400 }}>
              <Input 
                label="Nombre del Producto *" 
                placeholder="Ej. Arroz Costeño 1kg" 
                value={newProductName}
                onChangeText={setNewProductName}
                style={styles.input}
              />
              <Input 
                label="Precio (S/.) *" 
                placeholder="Ej. 4.50" 
                value={newProductPrice}
                onChangeText={setNewProductPrice}
                keyboardType="numeric"
                style={styles.input}
              />
              <Input 
                label="Descripción Corta" 
                placeholder="Ej. Grano largo, bolsa sellada" 
                value={newProductDesc}
                onChangeText={setNewProductDesc}
                style={styles.input}
              />

              {/* Subida de Imagen a Storage para Productos */}
              <Typography variant="body2" style={{ marginBottom: spacing.xs, fontWeight: 'bold' }}>Imagen del Producto</Typography>
              <View style={styles.imageSelectorRow}>
                {newProductImg ? (
                  <Image source={{ uri: newProductImg }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                  </View>
                )}
                
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: spacing.m }} />
                ) : (
                  <Button 
                    title="Subir Imagen" 
                    variant="outline" 
                    onPress={() => {
                      const cleanName = newProductName.replace(/[^a-zA-Z0-9]/g, '_') || 'prod';
                      handleSelectAndUploadImage(
                        `businesses/${user?.uid || 'unknown'}/products/${cleanName}_${Date.now()}.jpg`,
                        setNewProductImg
                      );
                    }} 
                    style={{ flex: 1, marginLeft: spacing.m }}
                  />
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: spacing.l }}>
              <Button 
                title="Cancelar" 
                variant="outline" 
                onPress={() => setProductModalVisible(false)} 
                style={{ flex: 1, marginRight: spacing.s }}
                disabled={saving || uploadingImage}
              />
              <Button 
                title="Guardar Producto" 
                onPress={handleAddProduct} 
                style={{ flex: 1 }}
                disabled={saving || uploadingImage}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CREACIÓN/EDICIÓN DE CATEGORÍAS (CRUD MANTENEDOR) */}
      <Modal visible={isCatCrudModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.l }}>
              <Typography variant="h3">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </Typography>
              <Ionicons name="close" size={24} color={colors.text} onPress={() => setCatCrudModalVisible(false)} />
            </View>
            
            <ScrollView style={{ maxHeight: 400 }}>
              <Input 
                label="Nombre de la Categoría *" 
                placeholder="Ej. Panaderías, Fruterías..." 
                value={catCrudName}
                onChangeText={setCatCrudName}
                style={styles.input}
              />

              {/* Subida de Imagen a Storage para Categorías */}
              <Typography variant="body2" style={{ marginBottom: spacing.xs, fontWeight: 'bold' }}>Imagen de la Categoría</Typography>
              <View style={styles.imageSelectorRow}>
                {catCrudImg ? (
                  <Image source={{ uri: catCrudImg }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                  </View>
                )}
                
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: spacing.m }} />
                ) : (
                  <Button 
                    title="Subir Imagen" 
                    variant="outline" 
                    onPress={() => {
                      const cleanName = catCrudName.replace(/[^a-zA-Z0-9]/g, '_') || 'cat';
                      handleSelectAndUploadImage(
                        `categories/${cleanName}_${Date.now()}.jpg`,
                        setCatCrudImg
                      );
                    }} 
                    style={{ flex: 1, marginLeft: spacing.m }}
                  />
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: spacing.l }}>
              <Button 
                title="Cancelar" 
                variant="outline" 
                onPress={() => setCatCrudModalVisible(false)} 
                style={{ flex: 1, marginRight: spacing.s }}
                disabled={saving || uploadingImage}
              />
              <Button 
                title="Guardar" 
                onPress={handleSaveCatCrud} 
                style={{ flex: 1 }}
                disabled={saving || uploadingImage}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE SELECCIÓN DE UBICACIÓN EN MAPA */}
      <Modal visible={isMapPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 600, height: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.s }}>
              <Typography variant="h2" style={{ fontWeight: 'bold' }}>Ubica tu Negocio</Typography>
              <Pressable onPress={() => setIsMapPickerVisible(false)} style={{ padding: spacing.xs }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={{ flex: 1, position: 'relative' }}>
              <MapPicker
                initialLatitude={tempLocation?.latitude}
                initialLongitude={tempLocation?.longitude}
                onSelectLocation={(loc) => setTempLocation(loc)}
              />
            </View>

            <View style={styles.pickerFooter}>
              {tempLocation && (
                <Typography variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.s, textAlign: 'center' }}>
                  Seleccionado: {tempLocation.latitude.toFixed(6)}, {tempLocation.longitude.toFixed(6)}
                </Typography>
              )}
              <View style={{ flexDirection: 'row', gap: spacing.s }}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setIsMapPickerVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Confirmar Ubicación"
                  variant="primary"
                  onPress={() => {
                    if (tempLocation) {
                      setLocLat(tempLocation.latitude.toFixed(6));
                      setLocLng(tempLocation.longitude.toFixed(6));
                    }
                    setIsMapPickerVisible(false);
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.l, paddingTop: 40, paddingBottom: 100 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    backgroundColor: '#FEEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  welcomeCard: {
    backgroundColor: '#E0F2F1',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.xl,
  },
  tabsRow: { flexDirection: 'row', marginBottom: spacing.l },
  tabBtn: { flex: 1, marginHorizontal: spacing.xs },
  input: { marginBottom: spacing.m },
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  imageSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: radius.m,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.m,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 4,
    marginBottom: spacing.m,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.s,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActiveOpen: {
    backgroundColor: colors.primary,
    ...shadows.soft,
  },
  toggleActiveClosed: {
    backgroundColor: colors.error,
    ...shadows.soft,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  hoursPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '12',
    padding: spacing.s,
    borderRadius: radius.s,
    marginBottom: spacing.m,
  },
  coordPreviewCard: {
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    backgroundColor: colors.primary + '08',
    padding: spacing.m,
    borderRadius: radius.m,
    marginBottom: spacing.m,
  },
  mapActionsRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  pickerFooter: {
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productImgContainer: {
    width: 60,
    height: 60,
  },
  productImgPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    padding: spacing.s,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
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
    maxHeight: '85%',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderCard: {
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: radius.m,
    borderTopRightRadius: radius.m,
  },
  statusBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: radius.s,
    backgroundColor: colors.warning + '20',
  },
  statusCompleted: {
    backgroundColor: colors.success + '20',
  },
  statusCancelled: {
    backgroundColor: colors.error + '20',
  },
  orderDetails: {
    padding: spacing.m,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.m,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderActions: {
    flexDirection: 'row',
    padding: spacing.m,
    paddingTop: 0,
  },
  galleryScrollView: {
    marginBottom: spacing.m,
  },
  galleryContent: {
    gap: spacing.s,
    paddingVertical: 4,
  },
  galleryThumbContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.m,
    position: 'relative',
    marginRight: spacing.s,
  },
  galleryThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.m,
  },
  galleryThumbDelete: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  galleryThumbPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.m,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
