import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateAuthProfile,
} from "firebase/auth";

// Production Firebase Configuration
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBduwVsxZSqKFJh4VQKLkiYPD5I2a6G-9w",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "e-all-store.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "e-all-store",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "e-all-store.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "148250949115",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:148250949115:web:cbd3d7a3283f7e4b53075e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3T69EZK0V7",
};

const STORAGE_KEY = "eall_firebase_config";

export const getActiveFirebaseConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.projectId && parsed.apiKey) return parsed;
    }
  } catch (e) {
    console.warn("Could not read stored Firebase config:", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (configObj) => {
  if (!configObj) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configObj));
  }
};

let appInstance = null;
let dbInstance = null;
let authInstance = null;

export const getFirebaseApp = () => {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) return null;

  if (!getApps().length) {
    appInstance = initializeApp(config);
  } else {
    appInstance = getApp();
  }
  return appInstance;
};

export const getFirebaseDb = () => {
  if (dbInstance) return dbInstance;
  const app = getFirebaseApp();
  if (app) {
    dbInstance = getFirestore(app);
    return dbInstance;
  }
  return null;
};

export const getFirebaseAuth = () => {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (app) {
    authInstance = getAuth(app);
    return authInstance;
  }
  return null;
};

export const isFirebaseConfigured = () => {
  const cfg = getActiveFirebaseConfig();
  return Boolean(cfg && cfg.apiKey && cfg.projectId);
};

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateAuthProfile,
};
