import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// 1. HELPER SIMPLIFICADO: Solo lee del entorno de Vite
// En Vercel, las variables del frontend SOLO se exponen a través de import.meta.env
const getEnv = (key: string): string | undefined => {
    // Usamos 'as any' para acceder a import.meta.env de forma segura en TypeScript
    // Vercel y Vite se encargan de exponer las variables con prefijo VITE_
    const env = (import.meta as any).env;
    return env ? env[key] : undefined;
};

// 2. CONFIGURACIÓN: Obtiene los valores usando el helper
const firebaseConfig = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('VITE_FIREBASE_APP_ID')
};

// 3. INSTANCIA DE FIRESTORE: Tipo definido como Firestore
let db: Firestore | null = null;

try {
    // Aseguramos que la clave de API exista
    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase initialized successfully");
    } else {
        console.warn("Firebase config missing or invalid. Using Local Storage fallback.");
        
        // El error CRITICAL solo debe mostrarse si estamos en Producción (en Vercel)
        // y la configuración falló. Usamos la forma nativa de Vite para chequear PROD.
        if ((import.meta as any).env.PROD) {
             console.error("CRITICAL: Firebase Env Vars are missing in Vercel!");
        }
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

export { db };
