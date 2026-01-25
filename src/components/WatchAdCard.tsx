"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Tv2 } from 'lucide-react';

type WatchAdCardProps = {
  updateCoinBalance: (newBalance: number) => void;
  coinBalance: number;
};

const AD_WATCH_SECONDS = 15;
const AD_REWARD = 2;

export default function WatchAdCard({ updateCoinBalance, coinBalance }: WatchAdCardProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'watching' | 'claimable'>('idle');
  const [countdown, setCountdown] = useState(AD_WATCH_SECONDS);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'watching' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && status === 'watching') {
      setStatus('claimable');
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [status, countdown]);

  const handleWatchAd = () => {
    // Here you would typically trigger a real ad SDK.
    // For now, we just start the countdown.
    setStatus('watching');
    setCountdown(AD_WATCH_SECONDS);
  };

  const handleClaim = () => {
    updateCoinBalance(coinBalance + AD_REWARD);
    toast({
      title: "¡Recompensa Obtenida!",
      description: `Has ganado ${AD_REWARD} monedas.`,
    });
    setStatus('idle'); // Reset for the next ad
  };
  
  const getButton = () => {
    switch (status) {
      case 'idle':
        return <Button onClick={handleWatchAd} className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase w-full md:w-auto">Ver Anuncio (+{AD_REWARD} Monedas)</Button>;
      case 'watching':
        return (
          <div className="w-full flex flex-col items-center gap-2">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${(AD_WATCH_SECONDS - countdown) / AD_WATCH_SECONDS * 100}%`, transition: 'width 1s linear' }}></div>
            </div>
            <Button disabled className="w-full md:w-auto uppercase">
                <Clock className="mr-2" />
                Viendo anuncio... ({countdown}s)
            </Button>
          </div>
        );
      case 'claimable':
        return (
            <Button onClick={handleClaim} className="bg-green-500 text-black hover:bg-green-400 font-bold uppercase w-full md:w-auto shadow-[0_0_15px_rgba(74,222,128,0.5)]">
                <CheckCircle className="mr-2" />
                Reclamar Recompensa
            </Button>
        );
    }
  };

  return (
    <Card className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-cyan-900/30 rounded-full">
            <Tv2 className="h-8 w-8 text-cyan-400" />
        </div>
        <div>
            <p className="font-bold text-lg text-white">Gana monedas extra</p>
            <p className="text-sm text-cyan-400 font-semibold">Mira un anuncio rápido</p>
        </div>
      </div>
      <div className="w-full md:w-auto md:min-w-[240px]">
        {getButton()}
      </div>
    </Card>
  );
}
