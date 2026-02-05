"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignIn from '@/components/auth/SignIn';
import ChatRoom from '@/components/ChatRoom';
import Dashboard from '@/components/Dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types';

function AppContainer() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch the current user's profile
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleUpdateUserProfile = (updates: Partial<UserProfile>) => {
    if (!userProfileRef) return;
    updateDocumentNonBlocking(userProfileRef, updates);
  };

  if (isProfileLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
        <p className="mt-4 text-slate-400">Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header coinBalance={userProfile.coinBalance} />
      <Dashboard userProfile={userProfile} updateUserProfile={handleUpdateUserProfile} />
      <ChatRoom userProfile={userProfile} />
      <Footer />
    </div>
  );
}

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex justify-between items-center p-4">
            <Skeleton className="h-12 w-48 bg-slate-700" />
            <Skeleton className="h-10 w-48 rounded-full bg-slate-700" />
          </div>
        </div>
         <Skeleton className="h-[600px] w-full max-w-4xl mt-8 rounded-xl bg-slate-700" />
      </div>
    )
  }

  if (!user) {
    return <SignIn />;
  }

  return <AppContainer />;
}
