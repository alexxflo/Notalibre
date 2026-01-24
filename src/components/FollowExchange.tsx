"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus } from 'lucide-react';

const COST_PER_FOLLOWER = 5;
const REWARD_PER_FOLLOW = 3;

type FollowExchangeProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
};

export default function FollowExchange({ coinBalance, updateCoinBalance }: FollowExchangeProps) {
  const { toast } = useToast();

  const handleRequestFollower = () => {
    if (coinBalance >= COST_PER_FOLLOWER) {
      updateCoinBalance(coinBalance - COST_PER_FOLLOWER);
      toast({
        title: "¡Éxito!",
        description: `Has gastado ${COST_PER_FOLLOWER} monedas. Pronto recibirás un seguidor.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Fondos Insuficientes",
        description: "No tienes suficientes monedas para solicitar un seguidor. Compra más en la tienda.",
      });
    }
  };

  const handleGiveFollow = () => {
    // In a real app, this would open a user profile and have a confirmation step
    updateCoinBalance(coinBalance + REWARD_PER_FOLLOW);
    toast({
        title: "¡Gracias!",
        description: `Has ganado ${REWARD_PER_FOLLOW} monedas por seguir a un usuario.`,
    });
  };

  return (
    <Card className="w-full shadow-lg border-none">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Users className="text-primary" /> Intercambio de Seguidores
        </CardTitle>
        <CardDescription>Gana monedas siguiendo a otros o gasta monedas para conseguir seguidores.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4 p-6 bg-primary/5 rounded-lg border border-primary/20 items-center text-center">
            <h3 className="font-headline text-xl font-semibold text-primary">Gana Seguidores</h3>
            <p className="text-card-foreground/80">Obtén un nuevo seguidor para tu perfil social.</p>
            <p className="font-bold text-lg">Costo: <span className="text-primary">{COST_PER_FOLLOWER} Monedas</span></p>
            <Button onClick={handleRequestFollower} disabled={coinBalance < COST_PER_FOLLOWER} className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" /> Gastar Monedas
            </Button>
        </div>
        <div className="flex flex-col gap-4 p-6 bg-secondary rounded-lg border border-border items-center text-center">
            <h3 className="font-headline text-xl font-semibold text-secondary-foreground">Gana Monedas</h3>
            <p className="text-muted-foreground">Sigue a otro usuario para ganar tu recompensa.</p>
            <p className="font-bold text-lg">Recompensa: <span className="text-green-600">{REWARD_PER_FOLLOW} Monedas</span></p>
            <Button onClick={handleGiveFollow} variant="secondary" className="w-full sm:w-auto">
                <Users className="mr-2 h-4 w-4" /> Seguir y Ganar
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
