"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useCampaigns } from '@/context/CampaignContext';
import { UserPlus } from 'lucide-react';

const COST_PER_CAMPAIGN = 5;

type CampaignFormProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
};

export default function CampaignForm({ coinBalance, updateCoinBalance }: CampaignFormProps) {
  const { toast } = useToast();
  const { addCampaign } = useCampaigns();
  const [url, setUrl] = useState('');
  const [socialNetwork, setSocialNetwork] = useState<'TikTok' | 'Facebook' | 'Instagram'>('TikTok');
  const [username, setUsername] = useState('');

  const handlePublish = () => {
    if (coinBalance < COST_PER_CAMPAIGN) {
      toast({
        variant: "destructive",
        title: "Fondos Insuficientes",
        description: `Necesitas al menos ${COST_PER_CAMPAIGN} monedas para crear una campaña.`,
      });
      return;
    }
    if (!url.startsWith('https://')) {
        toast({
            variant: "destructive",
            title: "URL Inválida",
            description: "Por favor, introduce una URL válida que empiece con https://",
        });
        return;
    }
    if (!username.startsWith('@')) {
        toast({
            variant: "destructive",
            title: "Nombre de usuario inválido",
            description: "El nombre de usuario debe empezar con @.",
        });
        return;
    }


    updateCoinBalance(coinBalance - COST_PER_CAMPAIGN);
    addCampaign({
      usuario: username,
      red_social: socialNetwork,
      url: url,
    });

    toast({
      title: "¡Campaña Publicada!",
      description: `Has gastado ${COST_PER_CAMPAIGN} monedas. Tu perfil ahora es visible para otros.`,
    });
    setUrl('');
    setUsername('');
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-primary/5 rounded-lg border border-primary/20">
        <h3 className="font-headline text-xl font-semibold text-primary">Crea una Campaña para Ganar Seguidores</h3>
        <p className="text-card-foreground/80">Publica tu perfil para que otros te sigan. Cada campaña te asegura un seguidor.</p>
        
        <div className="space-y-4">
            <Input 
                placeholder="@tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <Input 
                placeholder="https://tiktok.com/@tu_perfil"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />
            <Select onValueChange={(value: any) => setSocialNetwork(value)} defaultValue={socialNetwork}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona una red social" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                </SelectContent>
            </Select>
        </div>
        
        <p className="font-bold text-lg text-center">Costo: <span className="text-primary">{COST_PER_CAMPAIGN} Monedas</span></p>
        <Button onClick={handlePublish} disabled={coinBalance < COST_PER_CAMPAIGN || !url || !username}>
            <UserPlus className="mr-2 h-4 w-4" /> Publicar Campaña
        </Button>
    </div>
  );
}
