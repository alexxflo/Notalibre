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
    <div className="w-full max-w-4xl flex flex-col gap-6 p-2 md:p-6 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-cyan-500/20">
        <div className="text-center md:text-left">
            <h3 className="font-headline text-2xl font-semibold text-cyan-400 flex items-center justify-center md:justify-start gap-2 uppercase">
                <Users /> Gana Monedas Siguiendo a Otros
            </h3>
            <p className="text-slate-400 mt-1">Completa campañas para ganar monedas. Cada seguimiento verificado te da una recompensa.</p>
        </div>
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
                <div className="text-center text-slate-500 py-16">
                    <p className="font-bold text-lg">No hay campañas activas en este momento.</p>
                    <p>¡Vuelve más tarde o crea la tuya para empezar!</p>
                </div>
            )}
        </div>
    </div>
  );
}
