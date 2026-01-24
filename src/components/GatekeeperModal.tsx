"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TikTokIcon } from './icons';

type GatekeeperModalProps = {
  onConfirm: () => void;
};

export default function GatekeeperModal({ onConfirm }: GatekeeperModalProps) {
  const [countdown, setCountdown] = useState(20);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFollowing && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isFollowing, countdown]);

  const handleFollowClick = () => {
    window.open('https://www.tiktok.com/@alexxia1.0?is_from_webapp=1&sender_device=pc', '_blank');
    setIsFollowing(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-2xl animate-in fade-in-50 zoom-in-90 bg-slate-900 border-cyan-500/50 shadow-cyan-500/20">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-white uppercase">¡Bienvenido a SalvaFans!</CardTitle>
          <CardDescription className="text-slate-400">Un último paso para empezar a ganar seguidores.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="font-bold text-lg text-cyan-400">Sigue a @AlexxIA para desbloquear</p>
          {!isFollowing ? (
            <Button onClick={handleFollowClick} size="lg" className="font-headline shadow-lg animate-pulse bg-white text-black hover:bg-gray-200">
                <TikTokIcon className="mr-2 h-5 w-5" />
              Ir a TikTok y Seguir
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${(20 - countdown) / 20 * 100}%`, transition: 'width 1s linear' }}></div>
              </div>
              <p className="text-slate-400">Espera {countdown} segundos para confirmar...</p>
              <Button onClick={onConfirm} disabled={countdown > 0} size="lg" className="font-headline w-full bg-cyan-500 text-black hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400">
                Confirmar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
