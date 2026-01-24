"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Campaign {
  id: number;
  usuario: string;
  red_social: 'TikTok' | 'Facebook' | 'Instagram' | 'generic';
  url: string;
  recompensa: number;
  avatarUrl: string;
}

interface CampaignContextType {
  campaigns: Campaign[];
  addCampaign: (campaign: Omit<Campaign, 'id' | 'recompensa'>) => void;
  removeCampaign: (id: number) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

const initialCampaigns: Campaign[] = [
  { id: 1, usuario: '@charlidamelio', red_social: 'TikTok', url: 'https://www.tiktok.com/@charlidamelio', recompensa: 3, avatarUrl: 'https://unavatar.io/tiktok/charlidamelio' },
  { id: 2, usuario: '@instagram', red_social: 'Instagram', url: 'https://www.instagram.com/instagram', recompensa: 3, avatarUrl: 'https://unavatar.io/instagram/instagram' },
  { id: 3, usuario: '@facebook', red_social: 'Facebook', url: 'https://www.facebook.com/facebook', recompensa: 3, avatarUrl: 'https://unavatar.io/facebook/facebook' },
];

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);

  const addCampaign = useCallback((campaign: Omit<Campaign, 'id' | 'recompensa'>) => {
    const newCampaign: Campaign = {
      ...campaign,
      id: Date.now() + Math.random(),
      recompensa: 3,
    };
    // Create multiple campaigns based on the requested followers
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
