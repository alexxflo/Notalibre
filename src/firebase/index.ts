'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "salvafans",
  appId: "1:1071465839463:web:03f74352ac9695d73315a0",
  apiKey: "AIzaSyDEjmuSke21FhIqGqNn2prMtkFR-5MvRS4",
  authDomain: "salvafans.firebaseapp.com",
  measurementId: "G-F889T3E7PV",
  messagingSenderId: "1071465839463",
  storageBucket: "salvafans.appspot.com",
};

export function initializeFirebase() {
  if (!getApps().length) {
    // In a non-App-Hosting environment, the config must be provided explicitly.
    // The try/catch for automatic initialization was failing, so we now always
    // use the explicit configuration for robustness.
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
