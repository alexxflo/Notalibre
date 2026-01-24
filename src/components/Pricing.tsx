"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Gem, Copy, Star, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const coinPackages = [
  { coins: 20, price: 20, id: 'basic' },
  { coins: 50, price: 35, id: 'popular', popular: true },
  { coins: 100, price: 50, id: 'premium' },
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
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Procesando pago seguro...</AlertDialogTitle>
                <AlertDialogDescription className="flex flex-col items-center justify-center text-center pt-4 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <span>Conectando con la pasarela de pago. <br/> Por favor, espera un momento.</span>
                </AlertDialogDescription>
            </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline text-primary">Tienda de Monedas</h2>
          <p className="text-muted-foreground mt-2 text-lg">Compra monedas para aumentar tu visibilidad y conseguir más seguidores.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {coinPackages.map((pkg) => (
            <Card key={pkg.id} className={`flex flex-col ${pkg.popular ? 'border-primary shadow-lg relative' : 'shadow-md'}`}>
              {pkg.popular && (
                  <div className="absolute -top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1 shadow-md">
                      <Star className="w-4 h-4" /> Popular
                  </div>
              )}
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Gem className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="font-headline text-3xl">{pkg.coins} Monedas</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow items-center text-center">
                <p className="text-4xl font-bold">${pkg.price}<span className="text-lg font-medium text-muted-foreground"> MXN</span></p>
              </CardContent>
              <CardFooter>
                  <Button onClick={() => handlePurchase(pkg)} className="w-full font-headline" variant={pkg.popular ? 'default' : 'outline'}>Comprar Ahora</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <Card className="mt-16 text-center shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">¿Prefieres transferencia?</CardTitle>
                <CardDescription>Para transferencias manuales, envía comprobante al Admin.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Realiza un depósito o transferencia a la siguiente cuenta bancaria:</p>
                <div className="my-4 p-3 bg-muted rounded-md inline-flex items-center gap-4 ring-1 ring-border">
                    <p className="text-lg font-mono tracking-widest">{bankAccount}</p>
                    <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copiar número de cuenta">
                      <Copy className="h-5 w-5" />
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">Una vez realizado el pago, contacta a soporte para que tus monedas sean añadidas.</p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
