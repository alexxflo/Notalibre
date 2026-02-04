"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket, Users, Loader2, ShieldAlert } from 'lucide-react';
import GatekeeperModal from '@/components/GatekeeperModal';
import Header from '@/components/Header';
import CampaignForm from '@/components/CampaignForm';
import EarnSection from '@/components/EarnSection';
import Pricing from '@/components/Pricing';
import { Skeleton } from '@/components/ui/skeleton';
import Footer from '@/components/Footer';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import SignIn from '@/components/auth/SignIn';
import WatchAdCard from '@/components/WatchAdCard';
import ActivityFeed from '@/components/ActivityFeed';
import AdminDashboard from '@/components/AdminDashboard';
import { UserProfile } from '@/types';

export type View = 'home' | 'earn' | 'create' | 'store' | 'admin';

const WELCOME_BONUS = 250;

function MainApp() {
  const [view, setView] = useState<View>('home');
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  useEffect(() => {
    if (!firestore) return;

    const trackDailyVisit = async () => {
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = localStorage.getItem('lastDailyVisit');

        if (lastVisit === today) {
            return; // Already tracked today
        }

        const dailyStatsRef = doc(firestore, 'stats', 'daily_active');

        try {
            await runTransaction(firestore, async (transaction) => {
                const dailyStatsDoc = await transaction.get(dailyStatsRef);
                
                if (!dailyStatsDoc.exists() || dailyStatsDoc.data().date !== today) {
                    // New day or first ever visit, reset counter
                    transaction.set(dailyStatsRef, { count: 1, date: today });
                } else {
                    // Same day, increment counter
                    transaction.update(dailyStatsRef, { count: increment(1) });
                }
            });

            localStorage.setItem('lastDailyVisit', today);
        } catch (e) {
            console.error("Failed to track daily visit:", e);
        }
    };

    trackDailyVisit();
  }, [firestore]);

  const handleGatekeeperConfirm = () => {
    if (!userProfileRef) return;
    updateDocumentNonBlocking(userProfileRef, { 
      gatekeeperPassed: true,
      coinBalance: userProfile?.coinBalance === 0 ? WELCOME_BONUS : userProfile?.coinBalance
    });
  };
  
  const updateCoinBalance = (newBalance: number) => {
    if (newBalance < 0 || !userProfileRef) return;
    updateDocumentNonBlocking(userProfileRef, { coinBalance: newBalance });
  }

  const coinBalance = userProfile?.coinBalance ?? 0;

  if (isProfileLoading) {
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

  const renderView = () => {
    const backButton = (
      <Button variant="ghost" onClick={() => setView('home')} className="mb-4 self-start text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-300">
        <ArrowLeft className="mr-2" />
        Volver al Inicio
      </Button>
    );

    switch (view) {
      case 'earn':
        return (
          <div className="w-full flex flex-col items-center">
            {backButton}
            <EarnSection coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
          </div>
        );
      case 'create':
        return (
          <div className="w-full flex flex-col items-center">
            {backButton}
            <CampaignForm coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} setView={setView} />
          </div>
        );
      case 'store':
        return (
          <div className="w-full flex flex-col items-center">
            {backButton}
            <Pricing coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
          </div>
        );
      case 'admin':
        return (
          <div className="w-full flex flex-col items-center">
            {backButton}
            <AdminDashboard />
          </div>
        );
      case 'home':
      default:
        return (
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-headline mb-4 uppercase tracking-wider text-white">IMPULSA TU CRECIMIENTO SOCIAL</h2>
            <p className="text-slate-400 mb-8 md:mb-12 text-lg max-w-2xl mx-auto">Elige una opción para empezar a interactuar con la comunidad y hacer crecer tu perfil.</p>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div 
                className="p-8 bg-slate-900/50 border-2 border-cyan-500/30 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-center hover:bg-cyan-900/20 hover:border-cyan-500/70 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                onClick={() => setView('earn')}
              >
                <Users className="h-16 w-16 text-cyan-400 mb-4" />
                <h3 className="font-headline text-2xl font-bold mb-2 uppercase text-white">Ganar Monedas 💰</h3>
                <p className="text-slate-400 mb-6">Sigue a otros usuarios y completa tareas para obtener monedas gratis.</p>
                <Button size="lg" className="w-full font-headline uppercase bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_hsl(var(--primary))] hover:shadow-[0_0_25px_hsl(var(--primary))] transition-shadow">Empezar a Ganar</Button>
              </div>
              <div 
                className="p-8 bg-slate-900/50 border-2 border-slate-700 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-800/50 hover:border-slate-500 transition-all cursor-pointer shadow-lg"
                onClick={() => setView('create')}
              >
                <Rocket className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="font-headline text-2xl font-bold mb-2 uppercase text-white">Conseguir Seguidores 🚀</h3>
                <p className="text-slate-400 mb-6">Lanza una campaña para que otros usuarios te sigan y aumenta tu audiencia.</p>
                <Button size="lg" variant="secondary" className="w-full font-headline uppercase bg-magenta-600 text-white hover:bg-magenta-500 shadow-[0_0_15px_hsl(var(--secondary))] hover:shadow-[0_0_25px_hsl(var(--secondary))] transition-shadow">Crear Campaña</Button>
              </div>
            </div>
            <div className="mt-12 w-full max-w-4xl mx-auto">
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700/50"></span>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-900 px-4 text-sm text-slate-400 backdrop-blur-sm">O gana monedas extra</span>
                </div>
              </div>
              <div className="mt-4">
                <WatchAdCard coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ActivityFeed />
      <Header coinBalance={coinBalance} setView={setView} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        {renderView()}
      </main>
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
