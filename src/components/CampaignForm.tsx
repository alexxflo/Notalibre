"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Rocket, AlertTriangle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { View } from '@/app/page';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const COST_PER_FOLLOWER = 5;
const REWARD_PER_FOLLOW = 3;

type CampaignFormProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
  setView: (view: View) => void;
};

export default function CampaignForm({ coinBalance, updateCoinBalance, setView }: CampaignFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [url, setUrl] = useState('');
  const [socialNetwork, setSocialNetwork] = useState<'TikTok' | 'Facebook' | 'Instagram' | 'generic'>('generic');
  const [username, setUsername] = useState('');
  const [followers, setFollowers] = useState(10);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAvatarVerified, setIsAvatarVerified] = useState(false);

  const totalCost = followers * COST_PER_FOLLOWER;

  useEffect(() => {
    setIsAvatarVerified(false);
    if (!url) {
      setAvatarUrl('');
      setUsername('');
      return;
    }

    const extractData = (url: string) => {
        let platform: 'TikTok' | 'Facebook' | 'Instagram' | 'generic' = 'generic';
        let user = '';
        
        const tiktokMatch = url.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)/);
        if (tiktokMatch && tiktokMatch[1]) {
            platform = 'TikTok';
            user = `@${tiktokMatch[1]}`;
            setSocialNetwork('TikTok');
            return { platform: 'tiktok', user, finalUser: tiktokMatch[1] };
        }

        const instagramMatch = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        if (instagramMatch && instagramMatch[1]) {
            platform = 'Instagram';
            user = `@${instagramMatch[1]}`;
            setSocialNetwork('Instagram');
            return { platform: 'instagram', user, finalUser: instagramMatch[1] };
        }

        const facebookMatch = url.match(/facebook\.com\/([a-zA-Z0-9_.-]+)/);
        if (facebookMatch && facebookMatch[1]) {
            platform = 'Facebook';
            user = `@${facebookMatch[1].charAt(0).toUpperCase() + facebookMatch[1].slice(1)}`;
            setSocialNetwork('Facebook');
            return { platform: 'facebook', user, finalUser: facebookMatch[1] };
        }
        
        // Fallback for username
        const genericUserMatch = url.match(/@?([a-zA-Z0-9_.-]+)$/);
        if(genericUserMatch && genericUserMatch[1]){
            user = `@${genericUserMatch[1]}`
        }

        setSocialNetwork('generic');
        return { platform: 'generic', user, finalUser: genericUserMatch ? genericUserMatch[1] : 'default' };
    };

    const { platform, user, finalUser } = extractData(url);
    setUsername(user);
    setAvatarUrl(`https://unavatar.io/${platform}/${finalUser}`);

  }, [url]);

  const handlePublish = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "No estás autenticado",
        description: "Necesitas iniciar sesión para crear una campaña.",
      });
      return;
    }
    if (coinBalance < totalCost) {
      toast({
        variant: "destructive",
        title: "Fondos Insuficientes",
        description: `Necesitas ${totalCost} monedas, pero solo tienes ${coinBalance}. Serás redirigido a la tienda.`,
        action: <Button onClick={() => setView('store')}>Ir a la Tienda</Button>,
      });
      setTimeout(() => setView('store'), 3000);
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
    if (!username) {
        toast({
            variant: "destructive",
            title: "Nombre de usuario inválido",
            description: "No pudimos detectar un nombre de usuario en la URL.",
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

    const campaignsCollection = collection(firestore, 'campaigns');
    const newCampaignData = {
        userId: user.uid,
        username: username,
        socialNetwork: socialNetwork,
        url: url,
        avatarUrl: avatarUrl || `https://unavatar.io/generic/${username}`,
        reward: REWARD_PER_FOLLOW,
        createdAt: serverTimestamp(),
    };
    
    for (let i = 0; i < followers; i++) {
        addDocumentNonBlocking(campaignsCollection, newCampaignData);
    }

    toast({
      title: "¡Campaña Publicada!",
      description: `Has gastado ${totalCost} monedas para conseguir ${followers} seguidores.`,
    });
    
    setUrl('');
    setUsername('');
    setFollowers(10);
    setView('home');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 bg-slate-900/50 border-2 border-magenta-500/30 backdrop-blur-sm rounded-2xl w-full max-w-4xl mx-auto shadow-lg shadow-magenta-500/10">
      <div className="flex-grow space-y-6">
        <div>
          <h3 className="font-headline text-xl font-semibold text-magenta-400 uppercase">Crea una Campaña para Ganar Seguidores</h3>
          <p className="text-slate-400">Publica tu perfil para que otros te sigan. Cada seguidor que consigas costará {COST_PER_FOLLOWER} monedas.</p>
        </div>
        
        <div className="space-y-4">
          <Input 
              placeholder="https://tiktok.com/@tu_perfil"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-slate-900 border-slate-700 h-12 text-lg"
          />
          <Input
              type="number"
              placeholder="¿Cuántos seguidores quieres?"
              value={followers}
              onChange={(e) => setFollowers(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1"
              className="bg-slate-900 border-slate-700 h-12 text-lg"
          />
        </div>
        
        <div className={`p-4 rounded-md text-center ${coinBalance < totalCost ? 'bg-destructive/20 text-red-400' : 'bg-magenta-500/20 text-magenta-300'}`}>
            <p className="font-bold text-lg uppercase">Costo Total: <span className="font-mono">{totalCost} Monedas</span></p>
            {coinBalance < totalCost && (
                <p className="text-sm font-semibold flex items-center justify-center gap-2 mt-1"><AlertTriangle className="h-4 w-4"/> Saldo insuficiente</p>
            )}
        </div>

        <Button onClick={handlePublish} disabled={!url || !username || followers < 1} className="w-full h-12 font-headline uppercase bg-magenta-600 text-white hover:bg-magenta-500 shadow-[0_0_15px_hsl(var(--secondary))] hover:shadow-[0_0_25px_hsl(var(--secondary))] transition-shadow">
            <Rocket className="mr-2 h-5 w-5" /> Lanzar Campaña ({totalCost} Monedas)
        </Button>
      </div>
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center justify-center bg-slate-900 p-6 rounded-lg border border-slate-700">
        <h4 className="font-headline text-lg text-slate-300 mb-4">Vista Previa</h4>
        <div className="relative w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar Preview"
              width={128}
              height={128}
              className="rounded-full border-4 border-slate-600 object-cover"
              unoptimized
              onLoad={() => setIsAvatarVerified(true)}
              onError={() => setIsAvatarVerified(false)}
            />
          ) : (
            <ImageIcon className="w-16 h-16 text-slate-600" />
          )}
          {isAvatarVerified && (
            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-slate-900">
              <CheckCircle className="w-6 h-6 text-white"/>
            </div>
          )}
        </div>
        <p className="mt-4 text-white font-bold text-xl">{username || 'TuUsuario'}</p>
        <p className="text-slate-400">{socialNetwork !== 'generic' ? socialNetwork : 'Red Social'}</p>
      </div>
    </div>
  );
}
