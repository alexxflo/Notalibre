"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Users, Store, Gem, ShieldAlert, ThumbsUp, ThumbsDown, User, Bot, Loader2, LayoutDashboard, Camera } from 'lucide-react';
import GatekeeperModal from '@/components/GatekeeperModal';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import Footer from '@/components/Footer';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import SignIn from '@/components/auth/SignIn';
import AdminDashboard from '@/components/AdminDashboard';
import ChatRoom from '@/components/ChatRoom';
import { UserProfile } from '@/types';
import FlogDashboard from '@/components/flog/FlogDashboard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import './flog.css';
import EarnSection from '@/components/EarnSection';
import CampaignForm from '@/components/CampaignForm';
import Pricing from '@/components/Pricing';
import FlogFeed from '@/components/flog/FlogFeed';

const WELCOME_BONUS = 250;

function DashboardPanel({ onShowAdmin, isAdmin, coinBalance, updateCoinBalance }: { onShowAdmin: () => void; isAdmin: boolean, coinBalance: number, updateCoinBalance: (nb: number) => void }) {
  return (
    <div className="bg-slate-900/70 backdrop-blur-md p-6 rounded-lg border border-slate-700 flex flex-col md:flex-row items-center justify-center flex-wrap gap-4 mb-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="lg" className="font-headline uppercase bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_hsl(var(--primary)/0.5)] w-full md:w-auto">
            <Users className="mr-2" /> Ganar Monedas
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-slate-900 border-slate-700 text-white w-full md:w-auto">
          <SheetHeader>
            <SheetTitle className="text-cyan-400 font-headline text-2xl">Gana Monedas</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-[calc(100%-4rem)] overflow-y-auto">
            <EarnSection coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button size="lg" className="font-headline uppercase bg-magenta-600 text-white hover:bg-magenta-500 shadow-[0_0_15px_hsl(var(--secondary)/0.5)] w-full md:w-auto">
            <Rocket className="mr-2" /> Crear Campaña
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-slate-900 border-slate-700 text-white w-full md:w-auto">
          <SheetHeader>
            <SheetTitle className="text-magenta-400 font-headline text-2xl">Crear Campaña</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-[calc(100%-4rem)] overflow-y-auto">
            <CampaignForm coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} setView={() => {}} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button size="lg" variant="outline" className="font-headline uppercase border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white w-full md:w-auto">
            <Store className="mr-2" /> Tienda
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-slate-900 border-slate-700 text-white w-full md:w-auto">
          <SheetHeader>
            <SheetTitle className="text-cyan-400 font-headline text-2xl">Tienda de Monedas</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-[calc(100%-4rem)] overflow-y-auto">
            <Pricing coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
          </div>
        </SheetContent>
      </Sheet>

      {isAdmin && (
          <Button size="lg" onClick={onShowAdmin} variant="destructive" className="font-headline uppercase w-full md:w-auto">
            <ShieldAlert className="mr-2" /> Admin
          </Button>
      )}
    </div>
  );
}


function MainApp() {
  const [view, setView] = useState<'feed' | 'flog' | 'panel' | 'admin'>('feed');
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleGatekeeperConfirm = () => {
    if (!userProfileRef) return;
    updateDocumentNonBlocking(userProfileRef, { 
      gatekeeperPassed: true,
      coinBalance: userProfile?.coinBalance === 0 ? WELCOME_BONUS : userProfile?.coinBalance
    });
  };
  
  const coinBalance = userProfile?.coinBalance ?? 0;
  const isAdmin = user?.uid === 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';
  
  const updateCoinBalance = (newBalance: number) => {
    if (!userProfileRef) return;
    updateDocumentNonBlocking(userProfileRef, { coinBalance: newBalance });
  };


  if (isProfileLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (userProfile?.isBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center p-8 bg-slate-800/50 border border-red-500/50 rounded-2xl">
          <ShieldAlert className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-6 text-3xl font-bold text-red-400 font-headline">Cuenta Bloqueada</h1>
          <p className="mt-2 text-slate-400">Tu cuenta ha sido bloqueada por un administrador.</p>
          <p className="text-sm text-slate-500">Contacta a soporte para más información.</p>
        </div>
      </div>
    );
  }
  
  if (!userProfile?.gatekeeperPassed) {
    return <GatekeeperModal onConfirm={handleGatekeeperConfirm} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header coinBalance={coinBalance} setView={setView} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        {view === 'panel' && <DashboardPanel onShowAdmin={() => setView('admin')} isAdmin={isAdmin} coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />}
        
        {view === 'admin' && (
          <>
            <Button variant="ghost" onClick={() => setView('feed')} className="mb-4 self-start text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-300">
                Volver al Feed
            </Button>
            <AdminDashboard />
          </>
        )}
        
        {view === 'flog' && <FlogDashboard userProfile={userProfile} />}

        {view === 'feed' && <FlogFeed userProfile={userProfile} setView={setView} />}
      </main>
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
         <Skeleton className="h-96 w-full max-w-6xl mt-8 rounded-xl bg-slate-700" />
      </div>
    )
  }

  if (!user) {
    return <SignIn />;
  }

  return <MainApp />;
}
