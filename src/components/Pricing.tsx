"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Gem, Copy, Star } from 'lucide-react';

const coinPackages = [
  { coins: 20, price: 20, id: 'basic' },
  { coins: 50, price: 35, id: 'popular', popular: true },
  { coins: 100, price: 50, id: 'premium' },
];

const bankAccount = '638180000106470075';

export default function Pricing() {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(bankAccount);
    toast({
      title: "Copiado",
      description: "El número de cuenta ha sido copiado al portapapeles.",
    });
  };

  return (
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
                <Button className="w-full font-headline" variant={pkg.popular ? 'default' : 'outline'}>Comprar Ahora</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <Card className="mt-16 text-center shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Instrucciones de Pago</CardTitle>
                <CardDescription>Sigue estos pasos para completar tu compra.</CardDescription>
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
  );
}
