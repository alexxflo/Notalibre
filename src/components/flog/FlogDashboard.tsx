"use client";

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { UserProfile, FlogProfile } from '@/types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import PhotoManager from './PhotoManager';
import Guestbook from './Guestbook';
import FavoritesList from './FavoritesList';

type FlogDashboardProps = {
  userProfile: UserProfile;
};

export default function FlogDashboard({ userProfile }: FlogDashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isInitializing, setIsInitializing] = useState(false);

  const flogProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'flogs', user.uid);
  }, [firestore, user]);

  const { data: flogProfile, isLoading: isFlogLoading, error } = useDoc<FlogProfile>(flogProfileRef);

  // Effect to create a Flog profile if it doesn't exist
  useEffect(() => {
    const initializeFlog = async () => {
      if (!isFlogLoading && !flogProfile && user && userProfile && flogProfileRef) {
        setIsInitializing(true);
        try {
          const newFlogProfile: Partial<FlogProfile> = {
            userId: user.uid,
            username: userProfile.username,
            mainPhotoUrl: 'https://placehold.co/800x600/000000/00ffff/png?text=VORTEX',
            description: '¡Bienvenido a mi Flog! Deja tu firma.',
            lastPhotoUpdate: new Date(0) as any, // Set to epoch to allow immediate update
            themeColor: 'cyan',
          };
          await setDoc(flogProfileRef, newFlogProfile);
        } catch (e) {
          console.error("Error creating Flog profile:", e);
        } finally {
          setIsInitializing(false);
        }
      }
    };
    initializeFlog();
  }, [isFlogLoading, flogProfile, user, userProfile, flogProfileRef]);

  const themeClass = useMemo(() => {
    if (!flogProfile?.themeColor) return 'flog-theme-cyan';
    return `flog-theme-${flogProfile.themeColor}`;
  }, [flogProfile?.themeColor]);

  if (isFlogLoading || isInitializing) {
    return <Loader2 className="h-16 w-16 animate-spin text-cyan-400 my-16" />;
  }

  if (!flogProfile) {
    return (
      <div className="text-center my-16">
        <p className="text-red-500">No se pudo cargar o crear tu perfil de Flog.</p>
      </div>
    );
  }

  return (
    <div className={`flog-mode w-full max-w-7xl p-4 ${themeClass}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda y Central */}
        <div className="lg:col-span-2 space-y-6">
          <PhotoManager flogProfile={flogProfile} flogProfileRef={flogProfileRef} />
          <Guestbook userProfile={userProfile} flogProfile={flogProfile} />
        </div>

        {/* Columna Derecha */}
        <div className="space-y-6">
          <FavoritesList />
        </div>
      </div>
    </div>
  );
}
