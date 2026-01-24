"use client";

import CampaignCard from './CampaignCard';
import { Users, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

type EarnSectionProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
};

export default function EarnSection({ coinBalance, updateCoinBalance }: EarnSectionProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const campaignsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, 'campaigns'),
        where('userId', '!=', user.uid),
        orderBy('userId'), // Firestore requires orderBy when using '!='
        orderBy('createdAt', 'desc'),
        limit(50)
    );
  }, [firestore, user]);

  const { data: campaigns, isLoading } = useCollection(campaignsQuery);

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
            {!isLoading && campaigns && campaigns.length > 0 ? (
                campaigns.map(campaign => (
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
