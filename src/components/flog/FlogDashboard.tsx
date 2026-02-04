"use client";

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { UserProfile, FlogProfile } from '@/types';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
    const initializeFlog = () => {
      if (!isFlogLoading && !flogProfile && user && userProfile && flogProfileRef) {
        setIsInitializing(true);
        const newFlogProfile: Partial<FlogProfile> = {
          userId: user.uid,
          username: userProfile.username,
          mainPhotoUrl: 'https://placehold.co/800x600/000000/00ffff/png?text=VORTEX',
          description: '¡Bienvenido a mi Flog! Deja tu firma.',
          lastPhotoUpdate: new Date(0) as any, // Set to epoch to allow immediate update
          themeColor: 'cyan',
          likes: 0,
          dislikes: 0,
        };
        
        // Use non-blocking call for creation. Errors are handled globally.
        setDocumentNonBlocking(flogProfileRef, newFlogProfile, {});
        
        // The hook will trigger a re-render when data is available.
        // We can set initializing to false, but the UI will show the loader
        // until the useDoc hook gets the newly created document.
        setIsInitializing(false);
      }
    };
    initializeFlog();
  }, [isFlogLoading, flogProfile, user, userProfile, flogProfileRef]);

  const themeClass = useMemo(() => {
    if (!flogProfile?.themeColor) return 'flog-theme-cyan';
    return `flog-theme-${flogProfile.themeColor}`;
  }, [flogProfile?.themeColor]);

  useEffect(() => {
    // Add flog-mode class to body when this component mounts
    document.body.classList.add('flog-mode');
    // Remove it when the component unmounts
    return () => {
      document.body.classList.remove('flog-mode');
    };
  }, []);

  if (isFlogLoading || isInitializing) {
    return <Loader2 className="h-16 w-16 animate-spin text-cyan-400 my-16" />;
  }

  if (error || !flogProfile) {
    return (
      <div className="text-center my-16 text-white p-8 bg-red-900/20 border border-red-500 rounded-lg">
        <p className="font-bold text-lg">Error al Cargar el Flog</p>
        <p className="text-red-300">No se pudo cargar o crear tu perfil de Flog.</p>
        <p className="text-xs mt-2 text-slate-400">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-7xl p-4 ${themeClass}`}>
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
