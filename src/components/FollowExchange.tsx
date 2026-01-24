"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import CampaignForm from './CampaignForm';
import EarnSection from './EarnSection';

type FollowExchangeProps = {
  coinBalance: number;
  updateCoinBalance: (newBalance: number) => void;
};

export default function FollowExchange({ coinBalance, updateCoinBalance }: FollowExchangeProps) {
  return (
    <Card className="w-full shadow-lg border-none">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Users className="text-primary" /> Intercambio de Seguidores
        </CardTitle>
        <CardDescription>Gana monedas siguiendo a otros o gasta monedas para conseguir seguidores.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <CampaignForm coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
        <EarnSection coinBalance={coinBalance} updateCoinBalance={updateCoinBalance} />
      </CardContent>
    </Card>
  );
}
