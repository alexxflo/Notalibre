"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Tv2 } from 'lucide-react';

type WatchAdCardProps = {
  updateCoinBalance: (newBalance: number) => void;
  coinBalance: number;
};

const AD_REWARD = 2;

// --- ESTRUCTURA PARA ANUNCIOS BONIFICADOS DE GOOGLE ADSENSE ---
// Declara un objeto global para la API de anuncios. Google lo necesita.
declare global {
  interface Window {
    adsbygoogle: any;
    rewardedAdInitialized?: boolean;
  }
}
// --- FIN DE LA ESTRUCTURA ---


export default function WatchAdCard({ updateCoinBalance, coinBalance }: WatchAdCardProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'claimable'>('idle');

  // --- LÓGICA DE ANUNCIOS REALES ---
  useEffect(() => {
    // Cuando el componente se monta, intentamos cargar la API de anuncios de Google.
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      setStatus('ready'); // Asumimos que está listo; el script de Google gestionará la carga.
    } catch (e) {
      console.error("AdSense script not loaded yet.", e);
      setStatus('idle'); // Falla si el script de AdSense no cargó.
    }
  }, []);

  const handleShowAd = () => {
    setStatus('loading');
    // Esta función se debe llamar para mostrar el anuncio.
    // La API de AdSense se encarga de todo a partir de este push.
     window.adsbygoogle.push({
        key: "YOUR_AD_SLOT_ID", // TU CÓDIGO AQUÍ: Usa el mismo ID de bloque de anuncios.
        onClosed: (ad) => {
            if (ad && ad.isRewarded === false) {
                console.log("User closed ad without finishing.");
            }
            // El anuncio está listo para ser visto de nuevo.
            setStatus('ready'); 
        },
        onRewarded: (reward) => {
            console.log(`Reward earned:`, reward);
            // El usuario ha ganado la recompensa, habilitamos el botón de reclamar.
            setStatus('claimable');
        },
    });
  };

  const handleClaim = () => {
    updateCoinBalance(coinBalance + AD_REWARD);
    toast({
      title: "¡Recompensa Obtenida!",
      description: `Has ganado ${AD_REWARD} monedas.`,
    });
    // Reseteamos el estado para que se pueda ver otro anuncio.
    setStatus('ready'); 
  };
  
  const getButton = () => {
    switch (status) {
      case 'loading':
         return <Button disabled className="w-full md:w-auto uppercase"><Loader2 className="mr-2 animate-spin" /> Cargando Anuncio...</Button>;
      case 'ready':
        return <Button onClick={handleShowAd} className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase w-full md:w-auto">Ver Anuncio (+{AD_REWARD} Monedas)</Button>;
      case 'claimable':
        return (
            <Button onClick={handleClaim} className="bg-green-500 text-black hover:bg-green-400 font-bold uppercase w-full md:w-auto shadow-[0_0_15px_rgba(74,222,128,0.5)]">
                <CheckCircle className="mr-2" />
                Reclamar Recompensa
            </Button>
        );
      case 'idle':
      default:
        return <Button disabled className="w-full md:w-auto uppercase">Anuncios no disponibles</Button>;
    }
  };

  return (
    <Card className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-cyan-900/30 rounded-full">
            <Tv2 className="h-8 w-8 text-cyan-400" />
        </div>
        <div>
            <p className="font-bold text-lg text-white">Gana monedas extra</p>
            <p className="text-sm text-cyan-400 font-semibold">Mira un anuncio rápido</p>
        </div>
      </div>
      <div className="w-full md:w-auto md:min-w-[240px]">
        {getButton()}
      </div>
    </Card>
  );
}
