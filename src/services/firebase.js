// src/services/firebase.js
// Archivo de configuración para inicializar y conectar la aplicación con los servicios de Firebase

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Objeto de configuración de Firebase con variables de entorno
// Las variables se obtienen de forma segura desde el archivo .env para autenticar la aplicación con Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // Clave de API de Firebase
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, // Dominio de autenticación
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // ID del proyecto en Firebase
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // Bucket de almacenamiento
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // ID del remitente para mensajería
  appId: import.meta.env.VITE_FIREBASE_APP_ID, // ID único de la aplicación
};

// Inicializa la aplicación de Firebase con la configuración proporcionada
const app = initializeApp(firebaseConfig);

// Configura el servicio de autenticación de Firebase
// 'auth' permite manejar la autenticación de usuarios (inicio de sesión, registro, etc.)
export const auth = getAuth(app);
// Establece la persistencia de la sesión de autenticación en el navegador
// 'browserLocalPersistence' asegura que la sesión del usuario permanezca activa incluso al cerrar el navegador
setPersistence(auth, browserLocalPersistence);

// Configura el servicio de Firestore (base de datos en tiempo real)
// 'db' se utiliza para interactuar con la base de datos NoSQL de Firebase
export const db = getFirestore(app);