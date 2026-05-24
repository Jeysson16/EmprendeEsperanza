import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'cliente' | 'emprendedor';
  createdAt: any;
}

// Obtener el perfil del usuario desde Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return null;
  }
};

// Crear/Guardar perfil en Firestore
export const saveUserProfile = async (uid: string, profile: Omit<UserProfile, 'createdAt'>) => {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, {
    ...profile,
    createdAt: serverTimestamp()
  }, { merge: true });
};

// Registro con Email y Contraseña
export const registroConEmail = async (email: string, password: string, nombre: string, rol: 'cliente' | 'emprendedor'): Promise<UserProfile> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      displayName: nombre,
      role: rol,
      createdAt: new Date()
    };
    
    await saveUserProfile(user.uid, {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role
    });
    
    return profile;
  } catch (error: any) {
    console.error('Error en registro:', error);
    throw error;
  }
};

// Login con Email y Contraseña
export const loginConEmail = async (email: string, password: string): Promise<UserProfile> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      // Si por alguna razón no existe el documento en Firestore, lo creamos como cliente
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        displayName: user.displayName || 'Usuario',
        role: 'cliente',
        createdAt: new Date()
      };
      await saveUserProfile(user.uid, {
        uid: fallbackProfile.uid,
        email: fallbackProfile.email,
        displayName: fallbackProfile.displayName,
        role: fallbackProfile.role
      });
      return fallbackProfile;
    }
    return profile;
  } catch (error: any) {
    console.error('Error en login:', error);
    throw error;
  }
};

// Login con Google (Soporta Popup en Web y Sandbox en Móvil para desarrollo rápido)
export const loginConGoogle = async (rolPredeterminado: 'cliente' | 'emprendedor' = 'cliente'): Promise<UserProfile> => {
  try {
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        profile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Usuario Google',
          role: rolPredeterminado,
          createdAt: new Date()
        };
        await saveUserProfile(user.uid, {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          role: profile.role
        });
      }
      return profile;
    } else {
      // Sandbox para entorno móvil (Expo Go)
      // Simulamos la autenticación de Google registrando un usuario real en Firebase Auth 
      // para que toda la lógica de base de datos e inicio de sesión sea 100% real
      const mockEmail = `google.simulado.${Math.floor(Math.random() * 100000)}@esperanza.com`;
      const mockPassword = 'PasswordSimulado123!';
      const mockName = 'Google Test User';
      
      return await registroConEmail(mockEmail, mockPassword, mockName, rolPredeterminado);
    }
  } catch (error: any) {
    console.error('Error en Google Sign-In:', error);
    throw error;
  }
};

// Cerrar sesión
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};
