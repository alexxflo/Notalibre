'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Gem, Rocket, Shield, Megaphone } from 'lucide-react';
import type { UserProfile } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import EarnSection from '@/components/EarnSection';
import Pricing from '@/components/Pricing';
import AdminDashboard from '@/components/AdminDashboard';
import CampaignForm from '@/components/CampaignForm';
import CampaignGateModal from '@/components/CampaignGateModal';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';

const ADMIN_UID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';


export default function PanelPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const [activeTab, setActiveTab] = useState("earn");
    const [showCampaignGate, setShowCampaignGate] = useState(false);
    const [gateVerified, setGateVerified] = useState(false);

    const checkCampaignGate = () => {
        if (!userProfile) return;

        if (gateVerified) {
            return;
        }

        const lastCheck = userProfile.lastCampaignGateCheck?.toDate();
        const now = new Date();
        
        if (lastCheck) {
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            if (lastCheck > oneMonthAgo) {
                // Gate passed within the last month, allow access.
                setGateVerified(true);
                return;
            }
        }
        
        // Gate not passed or expired, show the modal.
        setShowCampaignGate(true);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (value === 'campaign') {
            checkCampaignGate();
        }
    };

    const handleGateConfirm = () => {
        if (!userProfileRef) return;
        updateDocumentNonBlocking(userProfileRef, { lastCampaignGateCheck: serverTimestamp() });
        setShowCampaignGate(false);
        setGateVerified(true);
    };

    const handleGateCancel = () => {
        setShowCampaignGate(false);
    };


    const updateCoinBalance = (newBalance: number) => {
        if (!userProfileRef) return;
        updateDocumentNonBlocking(userProfileRef, { coinBalance: newBalance });
    };

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user || !userProfile) {
        // This case should ideally be handled by a higher-order component
        // redirecting to login.
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Por favor, inicia sesión para acceder al panel.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            {showCampaignGate && (
                <CampaignGateModal onConfirm={handleGateConfirm} onCancel={handleGateCancel} />
            )}
            <h1 className="text-3xl font-headline text-white mb-8">Crecimiento de Cuentas</h1>
            <Tabs defaultValue="earn" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className={cn("grid w-full max-w-2xl", user.uid === ADMIN_UID ? "grid-cols-4" : "grid-cols-3")}>
                    <TabsTrigger value="earn"><Rocket className="mr-2 h-4 w-4"/>Ganar Monedas</TabsTrigger>
                    <TabsTrigger value="shop"><Gem className="mr-2 h-4 w-4"/>Comprar Monedas</TabsTrigger>
                    <TabsTrigger value="campaign"><Megaphone className="mr-2 h-4 w-4"/>Crear Campaña</TabsTrigger>
                    {user.uid === ADMIN_UID && (
                        <TabsTrigger value="admin"><Shield className="mr-2 h-4 w-4"/>Admin</TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="earn">
                    <EarnSection coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} />
                </TabsContent>
                <TabsContent value="shop">
                    <Pricing coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} />
                </TabsContent>
                <TabsContent value="campaign">
                    {gateVerified ? (
                        <CampaignForm coinBalance={userProfile.coinBalance} updateCoinBalance={updateCoinBalance} setView={() => { /* No-op, was for closing a sheet */ }} />
                    ) : (
                         <div className="text-center p-8 bg-card rounded-lg mt-6">
                           <p className="text-muted-foreground">Debes pasar la verificación para crear una campaña.</p>
                           <p className="text-sm text-muted-foreground/70">Selecciona de nuevo la pestaña "Crear Campaña" si ya has completado el paso.</p>
                        </div>
                    )}
                </TabsContent>
                {user.uid === ADMIN_UID && (
                    <TabsContent value="admin">
                        <AdminDashboard />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
