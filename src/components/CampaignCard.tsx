"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Campaign, useCampaigns } from '@/context/CampaignContext';
import { TikTokIcon } from './icons';
import { Instagram, Facebook } from 'lucide-react';

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
        return <Button onClick={handleFollow}>Seguir (+{campaign.recompensa} Monedas)</Button>;
      case 'pending':
        return (
          <div className="w-full flex flex-col items-center gap-2">
            <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS * 100}%`, transition: 'width 1s linear' }}></div>
            </div>
            <Button disabled>Verificando... ({countdown}s)</Button>
          </div>
        );
      case 'claimable':
        return <Button onClick={handleClaim}>Reclamar Recompensa</Button>;
    }
  };
  
  const getIcon = () => {
    switch(campaign.red_social) {
      case 'TikTok':
        return <TikTokIcon className="h-6 w-6 text-foreground" />;
      case 'Instagram':
        return <Instagram className="h-6 w-6 text-foreground" />;
      case 'Facebook':
        return <Facebook className="h-6 w-6 text-foreground" />;
    }
  }

  return (
    <Card className="p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {getIcon()}
        <div>
            <p className="font-bold">{campaign.usuario}</p>
            <p className="text-sm text-muted-foreground">{campaign.red_social}</p>
        </div>
      </div>
      {getButton()}
    </Card>
  );
}
