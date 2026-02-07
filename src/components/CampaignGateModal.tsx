'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { UserPlus } from 'lucide-react';

interface CampaignGateModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    creatorId: string;
};

export default function CampaignGateModal({ onConfirm, onCancel, creatorId }: CampaignGateModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-2xl animate-in fade-in-50 zoom-in-90 bg-slate-900 border-magenta-500/50 shadow-magenta-500/20">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-white uppercase">¡Acción Requerida!</CardTitle>
          <CardDescription className="text-slate-400">Para publicar una campaña, primero debes seguir al creador de VORTEX como apoyo a la comunidad.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="font-bold text-lg text-magenta-400">¡Es solo un clic!</p>
          <Link href={`/profile/${creatorId}`} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button size="lg" className="w-full font-headline shadow-lg bg-white text-black hover:bg-gray-200">
                <UserPlus className="mr-2 h-5 w-5" />
              Ir al Perfil y Seguir
            </Button>
          </Link>
          <p className="text-slate-500 text-sm">Una vez que lo sigas, vuelve aquí y haz clic en "Verificar". Esto solo se te pedirá una vez al mes.</p>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={onCancel} variant="ghost" className="w-full">Cancelar</Button>
            <Button onClick={onConfirm} className="w-full" variant="secondary">Ya lo sigo, ¡Verificar!</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
