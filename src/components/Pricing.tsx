"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Gem, Copy, Star, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const coinPackages = [
  { coins: 40, price: 20, id: 'basic' },
  { coins: 80, price: 35, id: 'standard' },
  { coins: 120, price: 50, id: 'premium' },
  { coins: 300, price: 100, id: 'pro', popular: true },
];

const bankAccount = '638180000106470075';

type PricingProps = {
    coinBalance: number;
    updateCoinBalance: (newBalance: number) => void;
}

export default function Pricing({ coinBalance, updateCoinBalance }: PricingProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bankAccount);
    toast({
      title: "Copiado",
      description: "El número de cuenta ha sido copiado al portapapeles.",
    });
  };

  const handlePurchase = (pkg: typeof coinPackages[0]) => {
    setIsLoading(true);

    setTimeout(() => {
      const newBalance = coinBalance + pkg.coins;
      updateCoinBalance(newBalance);
      setIsLoading(false);
      toast({
        title: "¡Pago Aprobado!",
        description: `Has recibido ${pkg.coins} monedas. Tu nuevo saldo es ${newBalance}.`,
      });
    }, 3000);
  };

  return (
    <>
      <AlertDialog open={isLoading}>
        <AlertDialogContent className="bg-slate-900 border-cyan-500/50">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-cyan-400">Procesando pago seguro...</AlertDialogTitle>
                <AlertDialogDescription className="flex flex-col items-center justify-center text-center pt-4 gap-4 text-slate-400">
                    <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                    <span>Conectando con la pasarela de pago. <br/> Por favor, espera un momento.</span>
                </AlertDialogDescription>
            </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline text-cyan-400 uppercase">Tienda de Monedas</h2>
          <p className="text-slate-400 mt-2 text-lg">Compra monedas para aumentar tu visibilidad y conseguir más seguidores.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {coinPackages.map((pkg) => (
            <Card key={pkg.id} className={`flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl transition-all hover:border-cyan-500/50 ${pkg.popular ? 'border-cyan-500 shadow-lg shadow-cyan-500/20 relative' : 'shadow-md'}`}>
              {pkg.popular && (
                  <div className="absolute -top-4 right-4 bg-cyan-500 text-black px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1 shadow-md">
                      <Star className="w-4 h-4" /> Popular
                  </div>
              )}
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-cyan-900/30 rounded-full mb-4">
                  <Gem className="w-12 h-12 text-cyan-400" />
                </div>
                <CardTitle className="font-headline text-3xl text-white">{pkg.coins.toLocaleString()} Monedas</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow items-center text-center">
                <p className="text-4xl font-bold text-white">${pkg.price}<span className="text-lg font-medium text-slate-400"> MXN</span></p>
              </CardContent>
              <CardFooter>
                  <Button onClick={() => handlePurchase(pkg)} className="w-full font-headline uppercase h-12 text-lg" variant={pkg.popular ? 'default' : 'outline'}>Comprar Ahora</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <Card className="mt-16 text-center shadow-lg bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-white">¿Prefieres transferencia?</CardTitle>
                <CardDescription className="text-slate-400">Para transferencias manuales, envía comprobante al Admin.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-slate-300">Realiza un depósito o transferencia a la siguiente cuenta bancaria:</p>
                <div className="my-4 p-3 bg-slate-900 rounded-md inline-flex items-center gap-4 ring-1 ring-slate-700">
                    <p className="text-lg font-mono tracking-widest text-white">{bankAccount}</p>
                    <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copiar número de cuenta" className="text-slate-400 hover:text-white">
                      <Copy className="h-5 w-5" />
                    </Button>
                </div>
                <p className="text-sm text-slate-500">Una vez realizado el pago, contacta a soporte para que tus monedas sean añadidas.</p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
