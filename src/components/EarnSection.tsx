"use client";

import CampaignCard from './CampaignCard';
import { Users, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Campaign } from '@/types';

type EarnSectionProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
};

export default function EarnSection({ coinBalance, updateCoinBalance }: EarnSectionProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const campaignsQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Simplified query to fetch the 50 most recent campaigns.
    // Filtering is now done on the client-side to avoid complex queries
    // that can conflict with security rules.
    return query(
        collection(firestore, 'campaigns'),
        orderBy('createdAt', 'desc'),
        limit(50)
    );
  }, [firestore, user]);

  const { data: campaigns, isLoading } = useCollection<Campaign>(campaignsQuery);
  
  // Filter out the current user's own campaigns on the client-side.
  const otherUserCampaigns = campaigns?.filter(campaign => campaign.userId !== user?.uid);

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6 p-2 md:p-6 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-cyan-500/20">
        <div className="text-center md:text-left">
            <h3 className="font-headline text-2xl font-semibold text-cyan-400 flex items-center justify-center md:justify-start gap-2 uppercase">
                <Users /> Gana Monedas Siguiendo a Otros
            </h3>
            <p className="text-slate-400 mt-1">Completa campañas para ganar monedas. Cada seguimiento verificado te da una recompensa.</p>
        </div>
        <div className="space-y-4">
            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              </div>
            )}
            {!isLoading && otherUserCampaigns && otherUserCampaigns.length > 0 ? (
                otherUserCampaigns.map(campaign => (
                    <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                        coinBalance={coinBalance} 
                        updateCoinBalance={updateCoinBalance}
                    />
                ))
            ) : (
                !isLoading && (
                    <div className="text-center text-slate-500 py-16">
                        <p className="font-bold text-lg">No hay campañas activas en este momento.</p>
                        <p>¡Vuelve más tarde o crea la tuya para empezar!</p>
                    </div>
                )
            )}
        </div>
    </div>
  );
}
