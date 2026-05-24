import { collection, getDocs, addDoc, query, where, GeoPoint, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export interface Business {
  id?: string;
  name: string;
  category: string;
  description: string;
  location: Location;
  address: string;
  phone: string;
  isOpen: boolean;
  imageUrl?: string;
  ownerId?: string;
  products?: Product[];
  distance?: number;
}

export interface Category {
  id?: string;
  name: string;
  imageUrl: string;
}

export const businessCollection = collection(db, 'businesses');
export const categoryCollection = collection(db, 'categories');

export const getCategories = async (): Promise<Category[]> => {
  try {
    const snapshot = await getDocs(categoryCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Calcular distancia (Haversine)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radio de la tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distancia en km
}

export const getBusinesses = async (userLat?: number, userLon?: number): Promise<(Business & { distance?: number })[]> => {
  try {
    const snapshot = await getDocs(businessCollection);
    const businesses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
    
    if (userLat && userLon) {
      return businesses.map(b => ({
        ...b,
        distance: getDistanceFromLatLonInKm(userLat, userLon, b.location.latitude, b.location.longitude)
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    return businesses;
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
};

export const getBusinessById = async (id: string): Promise<Business | null> => {
  try {
    const docRef = doc(db, 'businesses', id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Business;
    }
    return null;
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
};

export const getBusinessByOwnerId = async (ownerId: string): Promise<Business | null> => {
  try {
    const q = query(businessCollection, where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Business;
    }
    return null;
  } catch (error) {
    console.error('Error fetching business by owner:', error);
    return null;
  }
};

export const createBusiness = async (business: Omit<Business, 'id'>) => {
  try {
    const docRef = await addDoc(businessCollection, business);
    return docRef.id;
  } catch (error) {
    console.error('Error creating business:', error);
    throw error;
  }
};

export const updateBusiness = async (id: string, data: Partial<Business>) => {
  try {
    const docRef = doc(db, 'businesses', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating business:', error);
    throw error;
  }
};

// SCRIPT DE SEMILLA
export const seedInitialData = async (lat: number, lng: number) => {
  const mockBusinesses: Omit<Business, 'id'>[] = [
    {
      name: 'Bodega Doña Lucha',
      category: 'Bodegas',
      description: 'Tu bodega de confianza desde hace 15 años. Ofrecemos abarrotes, frutas frescas y más.',
      location: { latitude: lat + 0.002, longitude: lng + 0.001 },
      address: 'Av. Esperanza 452, Sector 2',
      phone: '+51 987 654 321',
      isOpen: true,
      products: [
        { name: 'Arroz costeño', description: 'Arroz de primera calidad 1kg', price: 4.50 },
        { name: 'Aceite Primor', description: 'Botella de 1 litro', price: 8.50 },
      ]
    },
    {
      name: 'Farmacia San Juan',
      category: 'Farmacias',
      description: 'Medicamentos y atención rápida para el barrio.',
      location: { latitude: lat - 0.001, longitude: lng + 0.003 },
      address: 'Av. Condorcanqui 120',
      phone: '+51 987 654 322',
      isOpen: true,
      products: []
    },
    {
      name: 'Restaurante El Sabor',
      category: 'Restaurantes',
      description: 'Menú económico y platos a la carta.',
      location: { latitude: lat + 0.003, longitude: lng - 0.002 },
      address: 'Calle Los Diamantes 33',
      phone: '+51 987 654 323',
      isOpen: false,
      products: [
        { name: 'Lomo Saltado', description: 'Jugoso lomo con papas fritas', price: 15.00 },
        { name: 'Ceviche', description: 'Pescado fresco del día', price: 20.00 },
      ]
    }
  ];

  const mockCategories: Omit<Category, 'id'>[] = [
    { name: 'Bodegas', imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400' },
    { name: 'Panaderías', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400' },
    { name: 'Restaurantes', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400' },
    { name: 'Farmacias', imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=400' },
    { name: 'Servicios', imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400' },
    { name: 'Belleza', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400' },
  ];

  for (const c of mockCategories) {
    await addDoc(categoryCollection, c);
  }

  for (const b of mockBusinesses) {
    await createBusiness(b);
  }
  console.log('Seed completado con éxito!');
};

export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error al subir imagen a storage:', error);
    throw error;
  }
};

export const createCategory = async (category: Omit<Category, 'id'>) => {
  try {
    const docRef = await addDoc(categoryCollection, category);
    return docRef.id;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, data: Partial<Category>) => {
  try {
    const docRef = doc(db, 'categories', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
