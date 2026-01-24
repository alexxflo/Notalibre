"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Campaign, useCampaigns } from '@/context/CampaignContext';
import { CheckCircle, Clock } from 'lucide-react';

type CampaignCardProps = {
  campaign: Campaign;
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
};

const COUNTDOWN_SECONDS = 20;

export default function CampaignCard({ campaign, coinBalance, updateCoinBalance }: CampaignCardProps) {
  const { toast } = useToast();
  const { removeCampaign } = useCampaigns();
  const [status, setStatus] = useState<'idle' | 'pending' | 'claimable'>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'pending' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && status === 'pending') {
      setStatus('claimable');
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [status, countdown]);

  const handleFollow = () => {
    window.open(campaign.url, '_blank');
    setStatus('pending');
  };

  const handleClaim = () => {
    updateCoinBalance(coinBalance + campaign.recompensa);
    removeCampaign(campaign.id);
    toast({
      title: "¡Recompensa Obtenida!",
      description: `Has ganado ${campaign.recompensa} monedas.`,
    });
  };

  const getButton = () => {
    switch (status) {
      case 'idle':
        return <Button onClick={handleFollow} className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase w-full md:w-auto">Seguir (+{campaign.recompensa} Monedas)</Button>;
      case 'pending':
        return (
          <div className="w-full flex flex-col items-center gap-2">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${(COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS * 100}%`, transition: 'width 1s linear' }}></div>
            </div>
            <Button disabled className="w-full md:w-auto uppercase">
                <Clock className="mr-2" />
                Verificando... ({countdown}s)
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
        <Image
          src={campaign.avatarUrl}
          alt={campaign.usuario}
          width={64}
          height={64}
          className="rounded-full border-2 border-cyan-400 shadow-lg"
          unoptimized // Required for unavatar
        />
        <div>
            <p className="font-bold text-lg text-white">{campaign.usuario}</p>
            <p className="text-sm text-cyan-400 font-semibold">{campaign.red_social}</p>
        </div>
      </div>
      <div className="w-full md:w-auto md:min-w-[240px]">
        {getButton()}
      </div>
    </Card>
  );
}
