"use client";

import { useState, useEffect } from 'react';
import GatekeeperModal from '@/components/GatekeeperModal';
import Header from '@/components/Header';
import FollowExchange from '@/components/FollowExchange';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';

const GATEKEEPER_KEY = 'salvafans_gatekeeper_passed';
const COIN_BALANCE_KEY = 'salvafans_coin_balance';
const WELCOME_BONUS = 50;

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isGatekeeperPassed, setIsGatekeeperPassed] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

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

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      {!isGatekeeperPassed ? (
        <GatekeeperModal onConfirm={handleGatekeeperConfirm} />
      ) : (
        <div className="min-h-screen flex flex-col bg-background">
          <Header coinBalance={coinBalance} />
          <main className="flex-grow container mx-auto p-4 md:p-8">
            <div className="space-y-12 md:space-y-16">
              <FollowExchange coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
              <Pricing />
            </div>
          </main>
          <Footer />
        </div>
      )}
    </>
  );
}
