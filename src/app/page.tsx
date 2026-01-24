"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket, Users } from 'lucide-react';
import GatekeeperModal from '@/components/GatekeeperModal';
import Header from '@/components/Header';
import CampaignForm from '@/components/CampaignForm';
import EarnSection from '@/components/EarnSection';
import Pricing from '@/components/Pricing';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignProvider } from '@/context/CampaignContext';
import Footer from '@/components/Footer';

const GATEKEEPER_KEY = 'vortex_gatekeeper_passed';
const COIN_BALANCE_KEY = 'vortex_coin_balance';
const WELCOME_BONUS = 50;

export type View = 'home' | 'earn' | 'create' | 'store';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isGatekeeperPassed, setIsGatekeeperPassed] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    const passed = localStorage.getItem(GATEKEEPER_KEY) === 'true';
    if (passed) {
      setIsGatekeeperPassed(true);
      const balance = localStorage.getItem(COIN_BALANCE_KEY);
      setCoinBalance(balance ? parseInt(balance, 10) : WELCOME_BONUS);
    }
    setIsClient(true);
  }, []);
  
  const handleGatekeeperConfirm = () => {
    localStorage.setItem(GATEKEEPER_KEY, 'true');
    localStorage.setItem(COIN_BALANCE_KEY, String(WELCOME_BONUS));
    setIsGatekeeperPassed(true);
    setCoinBalance(WELCOME_BONUS);
  };
  
  const updateCoinBalance = (newBalance: number) => {
    if (newBalance < 0) return;
    setCoinBalance(newBalance);
    localStorage.setItem(COIN_BALANCE_KEY, String(newBalance));
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
      case 'home':
      default:
        return (
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-headline mb-4 uppercase tracking-wider text-white">Domina el Algoritmo</h2>
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
          </div>
        );
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48 bg-slate-700" />
            <Skeleton className="h-10 w-24 rounded-full bg-slate-700" />
          </div>
        </div>
        <Skeleton className="h-96 w-full max-w-4xl mt-8 rounded-xl bg-slate-700" />
      </div>
    );
  }

  return (
    <>
      {!isGatekeeperPassed ? (
        <GatekeeperModal onConfirm={handleGatekeeperConfirm} />
      ) : (
        <CampaignProvider>
          <div className="min-h-screen flex flex-col">
            <Header coinBalance={coinBalance} setView={setView} />
            <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
              {renderView()}
            </main>
            <Footer />
          </div>
        </CampaignProvider>
      )}
    </>
  );
}
