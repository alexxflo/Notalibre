"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Campaign {
  id: number;
  usuario: string;
  red_social: 'TikTok' | 'Facebook' | 'Instagram';
  url: string;
  recompensa: number;
}

interface CampaignContextType {
  campaigns: Campaign[];
  addCampaign: (campaign: Omit<Campaign, 'id' | 'recompensa'>) => void;
  removeCampaign: (id: number) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

const initialCampaigns: Campaign[] = [
  { id: 1, usuario: '@influencer_cool', red_social: 'TikTok', url: 'https://www.tiktok.com/@charlidamelio', recompensa: 3 },
  { id: 2, usuario: '@viajero_digital', red_social: 'Instagram', url: 'https://www.instagram.com/instagram', recompensa: 3 },
  { id: 3, usuario: '@gamer_pro', red_social: 'Facebook', url: 'https://www.facebook.com/facebook', recompensa: 3 },
];

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);

  const addCampaign = useCallback((campaign: Omit<Campaign, 'id' | 'recompensa'>) => {
    const newCampaign: Campaign = {
      ...campaign,
      id: Date.now() + Math.random(),
      recompensa: 3,
    };
    setCampaigns(prev => [newCampaign, ...prev]);
  }, []);

  const removeCampaign = useCallback((id: number) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <CampaignContext.Provider value={{ campaigns, addCampaign, removeCampaign }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
}
