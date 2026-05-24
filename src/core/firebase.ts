import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ⚠️ REEMPLAZA ESTO CON LA CONFIGURACIÓN DE TU PROYECTO
// Ejecuta: `firebase apps:create web EmprendeEsperanzaWeb` y copia el resultado aquí.
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "emprendeesperanza-app-2026.firebaseapp.com",
  projectId: "emprendeesperanza-app-2026",
  storageBucket: "emprendeesperanza-app-2026.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
