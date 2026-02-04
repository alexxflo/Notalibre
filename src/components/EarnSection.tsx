"use client";

import { useMemo } from 'react';
import CampaignCard from './CampaignCard';
import WatchAdCard from './WatchAdCard';
import { Users, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import type { Campaign } from '@/types';
import ActivityFeed from '@/components/ActivityFeed';

type EarnSectionProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
};

// Define a type for the grouped campaign structure
type GroupedCampaign = {
    campaign: Campaign;
    count: number;
    ids: string[];
}

export default function EarnSection({ coinBalance, updateCoinBalance }: EarnSectionProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const campaignsQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Increased limit to fetch more for grouping
    return query(
        collection(firestore, 'campaigns'),
        limit(200)
    );
  }, [firestore, user]);

  const { data: campaigns, isLoading } = useCollection<Campaign>(campaignsQuery);
  
  const groupedCampaigns = useMemo((): GroupedCampaign[] => {
    if (!campaigns || !user) return [];

    const otherUserCampaigns = campaigns.filter(campaign => campaign.userId !== user.uid);

    const campaignGroups: Record<string, { campaign: Campaign; count: number; ids: string[] }> = {};

    for (const campaign of otherUserCampaigns) {
        // Group by a unique identifier for the campaign, the profile URL is good
        const key = campaign.url;
        if (!campaignGroups[key]) {
            campaignGroups[key] = {
                campaign: campaign, // Use the first one as a template
                count: 0,
                ids: []
            };
        }
        campaignGroups[key].count += 1;
        campaignGroups[key].ids.push(campaign.id);
    }
    
    // Convert the object back to an array
    return Object.values(campaignGroups);
  }, [campaigns, user]);


  return (
    <div className="w-full max-w-4xl flex flex-col gap-6 p-2 md:p-6 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-cyan-500/20">
        <ActivityFeed />
        <div className="text-center md:text-left">
            <h3 className="font-headline text-2xl font-semibold text-cyan-400 flex items-center justify-center md:justify-start gap-2 uppercase">
                <Users /> Gana Monedas
            </h3>
            <p className="text-slate-400 mt-1">Completa tareas para ganar monedas. Cada acción verificada te da una recompensa.</p>
        </div>
        <div className="space-y-4">
            <WatchAdCard coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700/50"></span>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-900/50 px-2 text-sm text-slate-400 backdrop-blur-sm">O sigue a otros</span>
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              </div>
            )}
            {!isLoading && groupedCampaigns && groupedCampaigns.length > 0 ? (
                groupedCampaigns.map(({ campaign, count, ids }) => (
                    <CampaignCard 
                        key={campaign.url} 
                        campaign={campaign} 
                        availableFollows={count}
                        campaignIds={ids}
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
