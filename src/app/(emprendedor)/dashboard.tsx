import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '@/shared/components/Typography';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { colors, spacing, layout, shadows, radius } from '@/core/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/core/context/AuthContext';
import { 
  getCategories, 
  getBusinessByOwnerId, 
  createBusiness, 
  updateBusiness, 
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImage,
  Category, 
  Business, 
  Product 
} from '@/core/services/firebaseService';

export default function MaintainerDashboard() {
  const router = useRouter();
  const { user, logoutUser, userProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'perfil' | 'catalogo' | 'categorias'>('perfil');
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isOpen, setIsOpen] = useState(true);

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
        setIsOpen(b.isOpen !== undefined ? b.isOpen : true);
        
        const matchedCat = cats.find(c => c.name === b.category);
        if (matchedCat) {
          setSelectedCategory(matchedCat);
        } else if (b.category) {
          setSelectedCategory({ name: b.category, imageUrl: '' });
        }
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
      
      // Subir a Firebase Storage y obtener URL pública
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

    setSaving(true);
    try {
      const businessData: Omit<Business, 'id'> = {
        name: businessName,
        category: selectedCategory.name,
        address,
        phone,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1473169643883-f8ed53bc87e9?auto=format&fit=crop&q=80&w=600',
        isOpen,
        ownerId: user.uid,
        location: business?.location || { latitude: -8.0805, longitude: -79.0354 }, // Coordenadas default Trujillo
        products: business?.products || []
      };

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
      loadData(); // Recargar datos locales
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
      // Redireccionamiento automático manejado en _layout.tsx
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
              {activeTab === 'categorias' ? 'Administración' : (business ? 'Mi Comercio' : 'Registra tu Local')}
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
            Administra tu información, sube tus fotos al Storage y gestiona categorías en tiempo real.
          </Typography>
        </View>

        {/* Pestañas de Navegación del Panel (Pestaña Categorías Integrada) */}
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
            title="Categorías" 
            variant={activeTab === 'categorias' ? 'primary' : 'ghost'} 
            onPress={() => setActiveTab('categorias')}
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

              {/* Sección de Foto de Portada con Subida Real a Storage */}
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
                    title="Subir al Storage" 
                    variant="outline" 
                    onPress={() => handleSelectAndUploadImage(
                      `businesses/${user?.uid || 'unknown'}/cover.jpg`, 
                      setImageUrl
                    )} 
                    style={{ flex: 1, marginLeft: spacing.m }}
                  />
                )}
              </View>

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

              {/* Estado del Local (Abierto / Cerrado) */}
              <Typography variant="body2" style={{ marginBottom: spacing.xs, fontWeight: 'bold' }}>Estado del Local</Typography>
              <View style={styles.toggleRow}>
                <Pressable 
                  style={[styles.toggleBtn, isOpen && styles.toggleActiveOpen]}
                  onPress={() => setIsOpen(true)}
                  disabled={saving}
                >
                  <Typography variant="body2" style={isOpen ? { color: '#fff', fontWeight: 'bold' } : { color: colors.textMuted }}>
                    Abierto
                  </Typography>
                </Pressable>
                <Pressable 
                  style={[styles.toggleBtn, !isOpen && styles.toggleActiveClosed]}
                  onPress={() => setIsOpen(false)}
                  disabled={saving}
                >
                  <Typography variant="body2" style={!isOpen ? { color: '#fff', fontWeight: 'bold' } : { color: colors.textMuted }}>
                    Cerrado
                  </Typography>
                </Pressable>
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
          ) : (
            // PESTAÑA: MANTENEDOR (CRUD) DE CATEGORÍAS
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l }}>
                <Typography variant="h3">Categorías de Comercios</Typography>
                <Button 
                  title="+ Nueva Categoría" 
                  variant="outline" 
                  onPress={() => {
                    setEditingCategory(null);
                    setCatCrudName('');
                    setCatCrudImg('');
                    setCatCrudModalVisible(true);
                  }}
                  disabled={saving}
                />
              </View>

              {categories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="grid-outline" size={48} color={colors.textMuted} />
                  <Typography variant="body1" color={colors.textMuted} style={{ marginTop: spacing.s, textAlign: 'center' }}>
                    No hay categorías registradas en el sistema.
                  </Typography>
                </View>
              ) : (
                categories.map((cat) => (
                  <View key={cat.id || cat.name} style={styles.productRow}>
                    <View style={styles.productImgContainer}>
                      {cat.imageUrl ? (
                        <Image source={{ uri: cat.imageUrl }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                      ) : (
                        <View style={styles.productImgPlaceholder}>
                          <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.m }}>
                      <Typography variant="body1" style={{ fontWeight: 'bold' }}>{cat.name}</Typography>
                      <Typography variant="body2" color={colors.textMuted} numberOfLines={1}>
                        Colección: categories
                      </Typography>
                    </View>
                    <Pressable 
                      style={styles.actionIcon} 
                      onPress={() => {
                        setEditingCategory(cat);
                        setCatCrudName(cat.name);
                        setCatCrudImg(cat.imageUrl);
                        setCatCrudModalVisible(true);
                      }}
                      disabled={saving}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable 
                      style={[styles.actionIcon, { marginLeft: spacing.s }]} 
                      onPress={() => handleDeleteCategory(cat.id!, cat.name)}
                      disabled={saving}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
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
  }
});
