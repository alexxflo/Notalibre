'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TikTokIcon } from './icons';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, arrayUnion } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Check, Loader2, Lock, UserCheck, Users, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface GrowthPanelGateProps {
    currentUserProfile: UserProfile;
    creatorProfile: UserProfile;
    onUnlock: () => void;
}

const CREATOR_ID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';
const COUNTDOWN_SECONDS = 10;

export default function GrowthPanelGate({ currentUserProfile, creatorProfile, onUnlock }: GrowthPanelGateProps) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const [tiktokFollowInitiated, setTiktokFollowInitiated] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const [isVerifying, setIsVerifying] = useState(false);

    const isFollowingOnVortex = creatorProfile.followers?.includes(currentUserProfile.id) ?? false;
    const tiktokStepCompleted = countdown === 0;

    useEffect(() => {
        if (tiktokFollowInitiated && countdown > 0) {
            const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [tiktokFollowInitiated, countdown]);

    const handleFollowTikTok = () => {
        window.open('https://www.tiktok.com/@alexxia1.0?is_from_webapp=1&sender_device=pc', '_blank');
        setTiktokFollowInitiated(true);
    };

    const handleFollowVortex = () => {
        const currentUserDocRef = doc(firestore, 'users', currentUserProfile.id);
        const creatorDocRef = doc(firestore, 'users', CREATOR_ID);

        if (!isFollowingOnVortex) {
            updateDocumentNonBlocking(currentUserDocRef, { following: arrayUnion(CREATOR_ID) });
            updateDocumentNonBlocking(creatorDocRef, { followers: arrayUnion(currentUserProfile.id) });
            toast({ description: `Ahora sigues a ${creatorProfile.username}.` });
        }
    };
    
    const handleVerifyAndUnlock = () => {
        if (!tiktokStepCompleted) {
             toast({ variant: 'destructive', description: 'Por favor, completa el paso de seguir en TikTok.' });
             return;
        }
        if (!isFollowingOnVortex) {
             toast({ variant: 'destructive', description: 'Debes seguir al creador en VORTEX para continuar.' });
             return;
        }

        setIsVerifying(true);
        
        onUnlock();

        toast({
            title: '¡Panel Desbloqueado!',
            description: 'Has ganado 200 monedas. ¡Gracias por tu apoyo!',
            className: 'bg-green-600 border-green-500 text-white',
            duration: 5000,
        });
    }

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl bg-slate-900 border-primary/50 shadow-primary/20">
            <CardHeader className="text-center">
                <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-headline text-3xl text-white uppercase">Desbloquear el Panel de Crecimiento</CardTitle>
                <CardDescription className="text-slate-400">Completa dos simples pasos para ganar acceso y recibir una recompensa de 200 monedas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Step 1: TikTok */}
                <div className={cn("p-4 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4 transition-all", tiktokStepCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-card border-border')}>
                    <div className="flex items-center gap-4">
                         <div className={cn("flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center", tiktokStepCompleted ? 'bg-green-500' : 'bg-primary')}>
                            <span className="font-bold text-xl text-primary-foreground">1</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Sigue al Creador en TikTok</h3>
                            <p className="text-sm text-muted-foreground">Apoya a la comunidad con un solo clic.</p>
                        </div>
                    </div>
                    {tiktokStepCompleted ? (
                        <div className="flex items-center gap-2 text-green-400 font-bold">
                            <Check /> ¡Paso Completado!
                        </div>
                    ) : tiktokFollowInitiated ? (
                         <Button disabled className="w-full md:w-auto">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando en {countdown}s...
                        </Button>
                    ) : (
                         <Button onClick={handleFollowTikTok} className="w-full md:w-auto">
                            <TikTokIcon className="mr-2" /> Seguir en TikTok
                        </Button>
                    )}
                </div>

                {/* Step 2: VORTEX */}
                <div className={cn("p-4 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4 transition-all", isFollowingOnVortex ? 'bg-green-500/10 border-green-500/30' : 'bg-card border-border')}>
                     <div className="flex items-center gap-4">
                         <div className={cn("flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center", isFollowingOnVortex ? 'bg-green-500' : 'bg-primary')}>
                            <span className="font-bold text-xl text-primary-foreground">2</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Sigue al Creador en VORTEX</h3>
                             <p className="text-sm text-muted-foreground">Encuéntralo como <Link href={`/profile/${CREATOR_ID}`} className="underline hover:text-primary">{creatorProfile.username}</Link>.</p>
                        </div>
                    </div>
                     {isFollowingOnVortex ? (
                        <div className="flex items-center gap-2 text-green-400 font-bold">
                            <UserCheck /> ¡Ya lo sigues!
                        </div>
                    ) : (
                         <Button onClick={handleFollowVortex} variant="secondary" className="w-full md:w-auto">
                            <Users className="mr-2" /> Seguir en VORTEX
                        </Button>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={handleVerifyAndUnlock} 
                    disabled={!tiktokStepCompleted || !isFollowingOnVortex || isVerifying} 
                    className="w-full h-12 text-lg font-headline bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20"
                >
                    {isVerifying ? <Loader2 className="animate-spin" /> : <PartyPopper className="mr-2" />}
                    Desbloquear Panel y Reclamar 200 Monedas
                </Button>
            </CardFooter>
        </Card>
    );
}
