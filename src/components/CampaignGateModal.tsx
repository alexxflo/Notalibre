'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TikTokIcon } from './icons';

interface CampaignGateModalProps {
    onConfirm: () => void;
    onCancel: () => void;
};

const COUNTDOWN_SECONDS = 20;

export default function CampaignGateModal({ onConfirm, onCancel }: CampaignGateModalProps) {
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (isFollowing && countdown > 0) {
            const timerId = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [isFollowing, countdown]);

    const handleFollowClick = () => {
        window.open('https://www.tiktok.com/@alexxia1.0?is_from_webapp=1&sender_device=pc', '_blank');
        setIsFollowing(true);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-2xl animate-in fade-in-50 zoom-in-90 bg-slate-900 border-magenta-500/50 shadow-magenta-500/20">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl text-white uppercase">¡Acción Requerida!</CardTitle>
                    <CardDescription className="text-slate-400">Para publicar una campaña, primero debes seguir al creador de VORTEX en TikTok como apoyo a la comunidad.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <p className="font-bold text-lg text-magenta-400">¡Es solo un clic!</p>
                    {!isFollowing ? (
                         <Button onClick={handleFollowClick} size="lg" className="w-full font-headline shadow-lg bg-white text-black hover:bg-gray-200">
                            <TikTokIcon className="mr-2 h-5 w-5" />
                            Ir a TikTok y Seguir
                        </Button>
                    ) : (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-magenta-400 h-2.5 rounded-full" style={{ width: `${(COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS * 100}%`, transition: 'width 1s linear' }}></div>
                            </div>
                            <p className="text-slate-400">Espera {countdown} segundos para verificar...</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col sm:flex-row gap-2">
                    <Button onClick={onCancel} variant="ghost" className="w-full">Cancelar</Button>
                    <Button onClick={onConfirm} disabled={countdown > 0 || !isFollowing} className="w-full" variant="secondary">Hecho, ¡Continuar!</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
