"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket, Users, Loader2, ShieldAlert, Store, Gem, Camera } from 'lucide-react';
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
import AdminDashboard from '@/components/AdminDashboard';
import ChatRoom from '@/components/ChatRoom';
import { UserProfile } from '@/types';
import MetroClock from '@/components/MetroClock';
import DashboardTile from '@/components/DashboardTile';
import InfoTile from '@/components/InfoTile';
import FlogDashboard from '@/components/flog/FlogDashboard';
import './metro.css';

export type View = 'dashboard' | 'earn' | 'create' | 'store' | 'admin' | 'flog';

const WELCOME_BONUS = 250;

function MainApp() {
  const [view, setView] = useState<View>('dashboard');
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const statsRef = useMemoFirebase(() => doc(firestore, 'stats', 'users'), [firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: stats, isLoading: isStatsLoading } = useDoc(statsRef);
  
  useEffect(() => {
    if (!firestore) return;

    const trackDailyVisit = async () => {
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = localStorage.getItem('lastDailyVisit');

        if (lastVisit === today) {
            return;
        }

        const dailyStatsRef = doc(firestore, 'stats', 'daily_active');

        try {
            await runTransaction(firestore, async (transaction) => {
                const dailyStatsDoc = await transaction.get(dailyStatsRef);
                
                if (!dailyStatsDoc.exists() || dailyStatsDoc.data().date !== today) {
                    transaction.set(dailyStatsRef, { count: 1, date: today });
                } else {
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
  const totalUsers = stats?.count ?? 0;
  const isAdmin = user?.uid === 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';


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

  const renderView = () => {
    const backButton = (
      <Button variant="ghost" onClick={() => setView('dashboard')} className="mb-4 self-start text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-300">
        <ArrowLeft className="mr-2" />
        Volver al Panel
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
      case 'flog':
          return (
            <div className="w-full flex flex-col items-center">
              {backButton}
              <FlogDashboard userProfile={userProfile} />
            </div>
          );
      case 'dashboard':
      default:
        return (
          <div className="w-full max-w-6xl mx-auto">
            <MetroClock username={userProfile?.username || 'Usuario'} />

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
              <DashboardTile
                title="Ganar Monedas"
                icon={Users}
                onClick={() => setView('earn')}
                className="bg-cyan-500 text-black col-span-2 md:col-span-2"
                size="large"
              />
              <DashboardTile
                title="Conseguir Seguidores"
                icon={Rocket}
                onClick={() => setView('create')}
                className="bg-magenta-600 text-white col-span-2 md:col-span-2"
                size="large"
              />
              <DashboardTile
                title="Mi Flog"
                icon={Camera}
                onClick={() => setView('flog')}
                className="bg-yellow-500 text-black"
              />
               <DashboardTile
                title="Tienda"
                icon={Store}
                onClick={() => setView('store')}
                className="bg-slate-700 text-white"
              />
              <InfoTile
                title="Mis Monedas"
                value={coinBalance.toLocaleString()}
                icon={Gem}
                className="bg-slate-800 text-cyan-400"
              />
              
              {isAdmin && (
                 <InfoTile
                    title="Total Usuarios"
                    value={totalUsers.toLocaleString()}
                    icon={Users}
                    className="bg-slate-800 text-magenta-400"
                  />
              )}
               {isAdmin && (
                  <DashboardTile
                    title="Admin"
                    icon={ShieldAlert}
                    onClick={() => setView('admin')}
                    className="bg-red-600 text-white"
                  />
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header coinBalance={coinBalance} setView={setView} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
        {renderView()}
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
