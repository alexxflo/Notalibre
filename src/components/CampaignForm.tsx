"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useCampaigns } from '@/context/CampaignContext';
import { Rocket, AlertTriangle } from 'lucide-react';
import { View } from '@/app/page';

const COST_PER_FOLLOWER = 5;

type CampaignFormProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
  setView: (view: View) => void;
};

export default function CampaignForm({ coinBalance, updateCoinBalance, setView }: CampaignFormProps) {
  const { toast } = useToast();
  const { addCampaign } = useCampaigns();
  const [url, setUrl] = useState('');
  const [socialNetwork, setSocialNetwork] = useState<'TikTok' | 'Facebook' | 'Instagram'>('TikTok');
  const [username, setUsername] = useState('');
  const [followers, setFollowers] = useState(1);

  const totalCost = followers * COST_PER_FOLLOWER;

  const handlePublish = () => {
    if (coinBalance < totalCost) {
      toast({
        variant: "destructive",
        title: "Fondos Insuficientes",
        description: `Necesitas ${totalCost} monedas, pero solo tienes ${coinBalance}.`,
        action: <Button onClick={() => setView('store')}>Ir a la Tienda</Button>,
      });
      setTimeout(() => setView('store'), 2000);
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
    if (followers < 1) {
        toast({
            variant: "destructive",
            title: "Cantidad inválida",
            description: "Debes solicitar al menos 1 seguidor.",
        });
        return;
    }

    updateCoinBalance(coinBalance - totalCost);
    
    for (let i = 0; i < followers; i++) {
        addCampaign({
            usuario: username,
            red_social: socialNetwork,
            url: url,
        });
    }

    toast({
      title: "¡Campaña Publicada!",
      description: `Has gastado ${totalCost} monedas para conseguir ${followers} seguidores.`,
    });
    
    setUrl('');
    setUsername('');
    setFollowers(1);
    setView('home');
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-primary/5 rounded-lg border border-primary/20 max-w-2xl mx-auto w-full">
        <h3 className="font-headline text-xl font-semibold text-primary">Crea una Campaña para Ganar Seguidores</h3>
        <p className="text-card-foreground/80">Publica tu perfil para que otros te sigan. Cada seguidor que consigas costará {COST_PER_FOLLOWER} monedas.</p>
        
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
            <Input
                type="number"
                placeholder="¿Cuántos seguidores quieres?"
                value={followers}
                onChange={(e) => setFollowers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                min="1"
            />
        </div>
        
        <div className={`p-4 rounded-md text-center ${coinBalance < totalCost ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <p className="font-bold text-lg">Costo Total: <span className="font-mono">{totalCost} Monedas</span></p>
            {coinBalance < totalCost && (
                <p className="text-sm font-semibold flex items-center justify-center gap-2 mt-1"><AlertTriangle className="h-4 w-4"/> Saldo insuficiente</p>
            )}
        </div>

        <Button onClick={handlePublish} disabled={!url || !username || followers < 1}>
            <Rocket className="mr-2 h-4 w-4" /> Lanzar Campaña ({totalCost} Monedas)
        </Button>
    </div>
  );
}
