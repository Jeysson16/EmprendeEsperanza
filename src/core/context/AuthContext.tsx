import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  UserProfile, 
  getUserProfile, 
  loginConEmail, 
  registroConEmail, 
  loginConGoogle, 
  logout,
  updateUserProfile
} from '../services/authService';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (email: string, password: string, nombre: string, rol: 'cliente' | 'emprendedor') => Promise<UserProfile>;
  loginWithGoogle: (rolPredeterminado?: 'cliente' | 'emprendedor') => Promise<UserProfile>;
  logoutUser: () => Promise<void>;
  updateProfileState: (updatedProfile: UserProfile) => void;
  updateUserProfileData: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error en cambio de estado de autenticación:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const profile = await loginConEmail(email, password);
      setUser(auth.currentUser);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, nombre: string, rol: 'cliente' | 'emprendedor') => {
    setLoading(true);
    try {
      const profile = await registroConEmail(email, password, nombre, rol);
      setUser(auth.currentUser);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (rolPredeterminado: 'cliente' | 'emprendedor' = 'cliente') => {
    setLoading(true);
    try {
      const profile = await loginConGoogle(rolPredeterminado);
      setUser(auth.currentUser);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileState = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const updateUserProfileData = async (displayName: string) => {
    if (!user || !userProfile) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, displayName);
      setUserProfile({
        ...userProfile,
        displayName
      });
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        register,
        loginWithGoogle,
        logoutUser,
        updateProfileState,
        updateUserProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
