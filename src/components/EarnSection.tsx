"use client";

import { useCampaigns } from '@/context/CampaignContext';
import CampaignCard from './CampaignCard';
import { Users } from 'lucide-react';

type EarnSectionProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
};

export default function EarnSection({ coinBalance, updateCoinBalance }: EarnSectionProps) {
  const { campaigns } = useCampaigns();

  return (
    <div className="flex flex-col gap-4 p-6 bg-secondary rounded-lg border border-border">
        <h3 className="font-headline text-xl font-semibold text-secondary-foreground flex items-center gap-2">
            <Users /> Gana Monedas Siguiendo a Otros
        </h3>
        <p className="text-muted-foreground">Completa campañas para ganar monedas. Cada seguimiento te da una recompensa.</p>
        <div className="space-y-4">
            {campaigns.length > 0 ? (
                campaigns.map(campaign => (
                    <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                        coinBalance={coinBalance} 
                        updateCoinBalance={updateCoinBalance}
                    />
                ))
            ) : (
                <p className="text-center text-muted-foreground py-8">No hay campañas activas en este momento. ¡Vuelve más tarde!</p>
            )}
        </div>
    </div>
  );
}
