"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Gem, Copy, Star, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser, useFirestore } from '@/firebase';
import { WhatsAppIcon } from './icons';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import MercadoPagoButton from './MercadoPagoButton';

const coinPackages = [
  { coins: 40, price: 20, id: 'basic', preferenceId: "180960088-31ed752e-5ed0-4cb3-a4ee-4fe97ca3198b" },
  { coins: 80, price: 35, id: 'standard', popular: true, preferenceId: "180960088-469aead4-c622-4d2e-be11-b524517fe4b2" },
  { coins: 120, price: 50, id: 'premium', preferenceId: "180960088-61cfc8e2-8739-4d85-9828-cb3cbb18e112" },
  { coins: 300, price: 100, id: 'pro', preferenceId: "180960088-6f60a895-9eb0-46a3-b80e-372274a81a7c" },
];

// Define the type with an optional preferenceId
type CoinPackage = {
    coins: number;
    price: number;
    id: string;
    preferenceId?: string;
    popular?: boolean;
};

const bankAccount = '638180000106470075';
const whatsappNumber = '525658925846';

type PricingProps = {
    coinBalance: number;
    updateCoinBalance: (newBalance: number) => void;
}

export default function Pricing({ coinBalance, updateCoinBalance }: PricingProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(bankAccount);
    toast({
      title: "Copiado",
      description: "El número de cuenta ha sido copiado al portapapeles.",
    });
  };

  const handleSendWhatsApp = async () => {
    if (!selectedPackage || !user) {
        toast({
            variant: "destructive",
            title: "Faltan datos",
            description: "Ocurrió un error. Por favor, cierra la ventana y vuelve a intentarlo.",
        });
        return;
    }
    
    setIsLoading(true);

    const verificationsCollection = collection(firestore, 'purchase_verifications');
    
    try {
        const newDocRef = await addDoc(verificationsCollection, {
            userId: user.uid,
            packageId: selectedPackage.id,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        const verificationId = newDocRef.id;

        const message = `Hola, he realizado un pago para el paquete de ${selectedPackage.coins} monedas por $${selectedPackage.price} MXN. Mi ID de verificación es: ${verificationId}. Adjunto mi comprobante. ¡Gracias! (IMPORTANTE para el ADMIN: Para aprobar esta compra, debes responder a este chat con el siguiente texto exacto: ok ${verificationId})`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        setIsTransferDialogOpen(false);
        
        toast({
            title: "¡Acción Requerida!",
            description: "Se abrirá WhatsApp para enviar tu ID. Informa al administrador que, para aprobar la compra, debe responder con el texto 'ok' seguido por tu ID de verificación.",
        });
    } catch (error) {
        console.error("Error creating verification:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo crear la solicitud de verificación. Inténtalo de nuevo."
        });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <>
      <AlertDialog open={isLoading}>
        <AlertDialogContent className="bg-slate-900 border-cyan-500/50">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-cyan-400">Procesando...</AlertDialogTitle>
                <AlertDialogDescription className="flex flex-col items-center justify-center text-center pt-4 gap-4 text-slate-400">
                    <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                    <span>Por favor, espera un momento.</span>
                </AlertDialogDescription>
            </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full">
        <div className="text-center mb-12">
          <p className="text-slate-400 mt-2 text-lg">Compra monedas para aumentar tu visibilidad y conseguir más seguidores.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {coinPackages.map((pkg: CoinPackage) => (
            <Card key={pkg.id} className={`flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl transition-all ${pkg.popular ? 'border-cyan-500 shadow-lg shadow-cyan-500/20 relative' : 'shadow-md'}`}>
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
                  <Button onClick={() => {
                      setSelectedPackage(pkg);
                      setIsTransferDialogOpen(true);
                  }} className="w-full font-headline uppercase h-12 text-lg" variant={pkg.popular ? 'default' : 'secondary'}>Comprar Ahora</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <Card className="mt-16 text-center shadow-lg bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-white">Métodos de Pago</CardTitle>
                <CardDescription className="text-slate-400">Paga con Mercado Pago o transferencia bancaria. Sigue los pasos para recargar.</CardDescription>
            </CardHeader>
             <CardContent>
                <Dialog open={isTransferDialogOpen} onOpenChange={(isOpen) => {
                    setIsTransferDialogOpen(isOpen);
                    if (!isOpen) {
                        setSelectedPackage(null); // Reset on close
                    }
                }}>
                    <DialogContent className="bg-slate-900 border-magenta-500/50">
                        <DialogHeader>
                            <DialogTitle className="text-magenta-400">Verificación de Pago Manual</DialogTitle>
                            <DialogDescription>
                                Completa los siguientes pasos para que podamos verificar tu pago y añadir las monedas a tu cuenta.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                           {selectedPackage?.preferenceId ? (
                                <>
                                    <p className="text-slate-300 text-sm">1. Paga ${selectedPackage.price} MXN con Mercado Pago usando el siguiente botón.</p>
                                    <MercadoPagoButton preferenceId={selectedPackage.preferenceId} />
                                    <p className="text-slate-300 text-sm">2. Una vez completado el pago, haz clic abajo para notificarnos por WhatsApp y recibir tus monedas.</p>
                                </>
                           ) : (
                                selectedPackage && (
                                    <>
                                        <p className="text-slate-300 text-sm">1. Realiza tu depósito de ${selectedPackage.price} MXN a la siguiente cuenta y guarda el comprobante:</p>
                                        <div className="my-2 p-3 bg-slate-800 rounded-md inline-flex items-center gap-4 ring-1 ring-slate-700 w-full">
                                            <p className="text-lg font-mono tracking-widest text-white flex-grow">{bankAccount}</p>
                                            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copiar número de cuenta" className="text-slate-400 hover:text-white">
                                              <Copy className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        <p className="text-slate-300 text-sm">2. Haz clic abajo para enviar tu comprobante y ID de verificación por WhatsApp. Un administrador deberá aprobarlo para que recibas tus monedas.</p>
                                    </>
                                )
                           )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSendWhatsApp} disabled={!selectedPackage || isLoading} className="w-full bg-green-600 hover:bg-green-500 text-white">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WhatsAppIcon className="mr-2 h-5 w-5"/>}
                                Verificar por WhatsApp
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <p className="text-xs text-slate-500 mt-4">
                    La acreditación de monedas puede tardar hasta 24 horas después de la verificación.
                </p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
