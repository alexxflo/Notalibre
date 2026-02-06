'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWUR7HC6dZp3DcsrnSjz2JPrBCDmM5yCs",
  authDomain: "studio-8356722446-5a6c6.firebaseapp.com",
  projectId: "studio-8356722446-5a6c6",
  storageBucket: "studio-8356722446-5a6c6.firebasestorage.app",
  messagingSenderId: "894641861323",
  appId: "1:894641861323:web:2ac2dea31786d0badae14e"
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
