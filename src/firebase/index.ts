'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC2Y5I3hXgG_s0C_Xk9wL5zT-1NqTohI",
  authDomain: "vortex-social-engine.firebaseapp.com",
  projectId: "vortex-social-engine",
  storageBucket: "vortex-social-engine.appspot.com",
  messagingSenderId: "365691084221",
  appId: "1:365691084221:web:d263a2c53f8c8577983b7c"
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
